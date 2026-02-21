#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCodeTool } from "@cloudflare/codemode/ai";
import { z } from "zod";

const ROOT = path.join(process.cwd(), ".ucmcp");
const SPECS = path.join(ROOT, "specs");

class NodeExecutor {
  constructor(timeoutMs = 10000) {
    this.timeoutMs = timeoutMs;
  }

  async execute(code, fns) {
    const logs = [];
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const capture = (...a) => logs.push(a.map(String).join(" "));

    console.log = capture;
    console.warn = capture;
    console.error = capture;

    try {
      const codemode = new Proxy(
        {},
        {
          get(_target, prop) {
            if (typeof prop !== "string") return undefined;
            const fn = fns[prop];
            if (!fn) {
              return async () => {
                throw new Error(`Unknown codemode function: ${prop}`);
              };
            }
            return async (input) => fn(input);
          },
        }
      );

      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const runner = new AsyncFunction("codemode", `return (${code})();`);
      const result = await Promise.race([
        runner(codemode),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Execution timed out (10s)")), this.timeoutMs)),
      ]);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e?.message || String(e), logs };
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    }
  }
}

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

async function serve(specName) {
  const spec = await loadDefaultSpec(specName);
  const authHeader = process.env.UCMCP_AUTH_HEADER || "authorization";
  const authPrefix = process.env.UCMCP_AUTH_PREFIX || "";
  const authValue = process.env.UCMCP_AUTH_VALUE || "";

  const executor = new NodeExecutor(10000);
  const server = new McpServer({ name: `universal-codemode-local-${spec.apiId}`, version: "0.1.0" });

  const searchTool = createCodeTool({
    executor,
    tools: {
      getSpec: {
        description: "Returns the processed OpenAPI spec",
        inputSchema: z.object({}),
        execute: async () => ({
          apiId: spec.apiId,
          title: spec.title,
          version: spec.version,
          paths: spec.paths,
          operations: spec.operations,
          schemas: spec.schemas,
        }),
      },
    },
    description: "Search local processed OpenAPI spec. Use codemode.getSpec({}) and return compact endpoint data.",
  });

  const executeTool = createCodeTool({
    executor,
    tools: {
      request: {
        description: "Execute one API request",
        inputSchema: z.object({
          operationId: z.string().optional(),
          method: z.string().optional(),
          path: z.string().optional(),
          pathParams: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
          query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.undefined()])).optional(),
          headers: z.record(z.string(), z.string()).optional(),
          body: z.unknown().optional(),
          contentType: z.string().optional(),
          rawBody: z.boolean().optional(),
        }),
        execute: async (options = {}) => {
          let method = options.method;
          let p = options.path;
          if (options.operationId) {
            const op = spec.operationMap[options.operationId];
            if (!op) throw new Error(`Unknown operationId: ${options.operationId}`);
            method = op.method.toUpperCase();
            p = op.path;
          }
          if (!method || !p) throw new Error("Provide operationId or method+path");

          if (options.pathParams) {
            for (const [k, v] of Object.entries(options.pathParams)) {
              p = p.replace("{" + k + "}", encodeURIComponent(String(v)));
            }
          }

          const u = new URL(spec.baseUrl + p);
          if (options.query) {
            for (const [k, v] of Object.entries(options.query)) {
              if (v !== undefined) u.searchParams.set(k, String(v));
            }
          }

          const headers = new Headers(options.headers || {});
          if (authValue) headers.set(authHeader, `${authPrefix}${authValue}`.trim());

          let body;
          if (options.rawBody) body = options.body;
          else if (options.body !== undefined) {
            headers.set("content-type", options.contentType || "application/json");
            body = JSON.stringify(options.body);
          }

          const resp = await fetch(u, { method, headers, body });
          const text = await resp.text();
          const contentType = resp.headers.get("content-type") || "";
          const parsed = contentType.includes("json")
            ? (() => {
                try {
                  return JSON.parse(text);
                } catch {
                  return text;
                }
              })()
            : text;
          return { status: resp.status, ok: resp.ok, headers: Object.fromEntries(resp.headers.entries()), data: parsed };
        },
      },
    },
    description: "Execute requests against local configured API using codemode.request(...)",
  });

  server.registerTool("search", { description: searchTool.description, inputSchema: searchTool.inputSchema }, async ({ code }) => {
    try {
      const out = await searchTool.execute({ code }, { toolCallId: "search", messages: [] });
      return { content: [{ type: "text", text: JSON.stringify({ result: out.result, logs: out.logs }, null, 2) }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }] };
    }
  });

  server.registerTool("execute", { description: executeTool.description, inputSchema: executeTool.inputSchema }, async ({ code }) => {
    try {
      const out = await executeTool.execute({ code }, { toolCallId: "execute", messages: [] });
      return { content: [{ type: "text", text: JSON.stringify({ result: out.result, logs: out.logs }, null, 2) }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }] };
    }
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
