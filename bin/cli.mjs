#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ROOT = path.join(process.cwd(), ".ucmcp");
const SPECS = path.join(ROOT, "specs");

async function loadDefaultSpec(specName) {
  const files = (await fs.readdir(SPECS).catch(() => [])).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) throw new Error("No local specs found. Put processed spec JSON into .ucmcp/specs/*.json");

  let selected = files[0];
  if (specName) {
    const normalized = specName.endsWith(".json") ? specName : `${specName}.json`;
    if (!files.includes(normalized)) {
      throw new Error(`Spec not found: ${specName}. Available: ${files.join(", ")}`);
    }
    selected = normalized;
  }

  const text = await fs.readFile(path.join(SPECS, selected), "utf8");
  return JSON.parse(text);
}

function runWorker(payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const logs = [];
      console.log = (...a) => logs.push(a.map(String).join(' '));
      (async () => {
        const { code, mode, spec, operationMap, baseUrl, authHeader, authValue, timeoutMs } = workerData;
        const withTimeout = (p) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('Execution timed out (10s)')), timeoutMs))]);
        try {
          if (mode === 'search') {
            const fn = new AsyncFunction('spec', 'return (' + code + ')();');
            const result = await withTimeout(fn(spec));
            parentPort.postMessage({ result, logs });
            return;
          }
          const api = {
            request: async (options) => {
              let method = options.method;
              let p = options.path;
              if (options.operationId) {
                const op = operationMap[options.operationId];
                if (!op) throw new Error('Unknown operationId: ' + options.operationId);
                method = op.method.toUpperCase();
                p = op.path;
              }
              if (!method || !p) throw new Error('Provide operationId or method+path');
              if (options.pathParams) for (const [k,v] of Object.entries(options.pathParams)) p = p.replace('{' + k + '}', encodeURIComponent(String(v)));
              const u = new URL(baseUrl + p);
              if (options.query) for (const [k,v] of Object.entries(options.query)) if (v !== undefined) u.searchParams.set(k, String(v));
              const headers = new Headers(options.headers || {});
              if (authValue) headers.set(authHeader, authValue);
              let body;
              if (options.rawBody) body = options.body;
              else if (options.body !== undefined) { headers.set('content-type', options.contentType || 'application/json'); body = JSON.stringify(options.body); }
              const resp = await fetch(u, { method, headers, body });
              const text = await resp.text();
              return { status: resp.status, ok: resp.ok, data: text };
            }
          };
          const fn = new AsyncFunction('api', 'return (' + code + ')();');
          const result = await withTimeout(fn(api));
          parentPort.postMessage({ result, logs });
        } catch (e) {
          parentPort.postMessage({ result: undefined, error: e?.message || String(e), logs });
        }
      })();
    `, { eval: true, workerData: payload });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => code !== 0 && reject(new Error(`Worker exited: ${code}`)));
  });
}

async function serve(specName) {
  const spec = await loadDefaultSpec(specName);
  const authHeader = process.env.UCMCP_AUTH_HEADER || "authorization";
  const authValue = process.env.UCMCP_AUTH_VALUE || "";

  const server = new McpServer({ name: `universal-codemode-local-${spec.apiId}`, version: "0.1.0" });
  server.registerTool("search", { description: "Search local processed OpenAPI spec", inputSchema: { code: z.string() } }, async ({ code }) => {
    const out = await runWorker({ mode: "search", code, spec, timeoutMs: 10000 });
    if (out.error) return { isError: true, content: [{ type: "text", text: `Error: ${out.error}` }] };
    return { content: [{ type: "text", text: JSON.stringify({ result: out.result, logs: out.logs }, null, 2) }] };
  });

  server.registerTool("execute", { description: "Execute requests against local configured API", inputSchema: { code: z.string() } }, async ({ code }) => {
    const out = await runWorker({ mode: "execute", code, baseUrl: spec.baseUrl, operationMap: spec.operationMap, authHeader, authValue, timeoutMs: 10000 });
    if (out.error) return { isError: true, content: [{ type: "text", text: `Error: ${out.error}` }] };
    return { content: [{ type: "text", text: JSON.stringify({ result: out.result, logs: out.logs }, null, 2) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (cmd === "serve") {
  const specIndex = args.indexOf("--spec");
  const specName = specIndex >= 0 ? args[specIndex + 1] : undefined;

  serve(specName).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.log("Usage: universal-codemode-mcp serve [--spec <name-or-file.json>]");
}
