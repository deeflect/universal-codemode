import { parse } from "acorn";
import type { ApiMetadata, Env, ProcessedSpec } from "./types";

interface Entrypoint {
  evaluate(props: Record<string, unknown>): Promise<{ result: unknown; error?: string; logs?: string[] }>;
}

function maybeWrapScriptBody(code: string): string {
  const t = code.trim();
  const ast = parse(t, { ecmaVersion: "latest", sourceType: "script" }) as unknown as {
    body: Array<{ type: string }>;
  };
  if (!ast.body.length) return "return undefined;";
  const last = ast.body[ast.body.length - 1]?.type;
  if (last === "ExpressionStatement") {
    const idx = t.lastIndexOf("\n");
    if (idx === -1) return `return (${t});`;
    const head = t.slice(0, idx);
    const tail = t.slice(idx + 1);
    return `${head}\nreturn (${tail});`;
  }
  return t;
}

function normalizeCode(code: string): string {
  const t = code.trim();
  if (/^async\s*\([^)]*\)\s*=>/.test(t)) return t;
  if (/^async\s+function/.test(t)) return `(${t})`;
  const wrapped = maybeWrapScriptBody(t);
  return `async () => {\n${wrapped}\n}`;
}

export function createSearchExecutor(env: Env) {
  return async (code: string, rawSpecText: string) => {
    const worker = env.LOADER.get(`search-${crypto.randomUUID()}`, () => ({
      compatibilityDate: "2026-01-12",
      globalOutbound: null, // no network for search; execution only against embedded spec data
      mainModule: "worker.js",
      modules: {
        "worker.js": `
import { WorkerEntrypoint } from 'cloudflare:workers';
const spec = ${rawSpecText};
export default class SearchWorker extends WorkerEntrypoint {
  async evaluate(props) {
    const logs = [];
    console.log = (...a) => logs.push(a.map(String).join(' '));
    const TIMEOUT_MS = 10000;
    try {
      const result = await Promise.race([
        (${normalizeCode(code)})(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Execution timed out (10s)')), TIMEOUT_MS))
      ]);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e instanceof Error ? e.message : String(e), logs };
    }
  }
}`
      }
    }));
    const entry = worker.getEntrypoint() as unknown as Entrypoint;
    return entry.evaluate({});
  };
}

export function createExecuteExecutor(env: Env, ctx: ExecutionContext & { exports: any }) {
  return async (code: string, spec: ProcessedSpec, meta: ApiMetadata, authValue: string, maxRequests: number) => {
    const worker = env.LOADER.get(`exec-${crypto.randomUUID()}`, () => ({
      compatibilityDate: "2026-01-12",
      globalOutbound: ctx.exports.GlobalOutbound({
        props: {
          allowedHosts: meta.allowedHosts,
          authHeader: meta.authHeaderName,
          authValue,
          authPrefix: meta.authPrefix
        }
      }),
      mainModule: "worker.js",
      modules: {
        "worker.js": `
import { WorkerEntrypoint } from 'cloudflare:workers';
const baseUrl = ${JSON.stringify(spec.baseUrl)};
const opMap = ${JSON.stringify(spec.operationMap)};
export default class ExecuteWorker extends WorkerEntrypoint {
  async evaluate(props) {
    const logs = [];
    let reqCount = 0;
    console.log = (...a) => logs.push(a.map(String).join(' '));

    const api = {
      async request(options) {
        reqCount++;
        if (reqCount > ${maxRequests}) throw new Error('Exceeded request budget for one execute() run');

        let method = options.method;
        let path = options.path;
        if (options.operationId) {
          const op = opMap[options.operationId];
          if (!op) throw new Error('Unknown operationId: ' + options.operationId);
          method = op.method.toUpperCase();
          path = op.path;
        }
        if (!method || !path) throw new Error('Provide operationId or method+path');

        if (options.pathParams) {
          for (const [k, v] of Object.entries(options.pathParams)) {
            path = path.replace('{' + k + '}', encodeURIComponent(String(v)));
          }
        }

        const u = new URL(baseUrl + path);
        if (options.query) for (const [k, v] of Object.entries(options.query)) if (v !== undefined) u.searchParams.set(k, String(v));

        const headers = new Headers(options.headers || {});
        let body;
        if (options.rawBody) body = options.body;
        else if (options.body !== undefined) {
          headers.set('content-type', options.contentType || 'application/json');
          body = JSON.stringify(options.body);
        }

        const resp = await fetch(u.toString(), { method, headers, body });
        const contentType = resp.headers.get('content-type') || '';
        const text = await resp.text();
        const parsed = contentType.includes('json') ? (() => { try { return JSON.parse(text); } catch { return text; } })() : text;
        return { status: resp.status, ok: resp.ok, headers: Object.fromEntries(resp.headers.entries()), data: parsed };
      }
    };

    const TIMEOUT_MS = 10000;
    try {
      const result = await Promise.race([
        (${normalizeCode(code)})(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Execution timed out (10s)')), TIMEOUT_MS))
      ]);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e instanceof Error ? e.message : String(e), logs };
    }
  }
}`
      }
    }));

    const entry = worker.getEntrypoint() as unknown as Entrypoint;
    return entry.evaluate({});
  };
}
