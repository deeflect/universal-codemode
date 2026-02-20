import { parse } from "acorn";
import type { ApiMetadata, Env, ProcessedSpec } from "./types";

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

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function createSearchExecutor(_env: Env) {
  return async (code: string, rawSpecText: string) => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...a: unknown[]) => logs.push(a.map(String).join(" "));
    try {
      const spec = JSON.parse(rawSpecText);
      const fn = new AsyncFunction("spec", `return (${normalizeCode(code)})();`);
      const result = await Promise.race([
        fn(spec),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Execution timed out (10s)")), 10000)),
      ]);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e instanceof Error ? e.message : String(e), logs };
    } finally {
      console.log = origLog;
    }
  };
}

export function createExecuteExecutor(env: Env, _ctx: ExecutionContext) {
  return async (code: string, spec: ProcessedSpec, meta: ApiMetadata, authValue: string, maxRequests: number) => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...a: unknown[]) => logs.push(a.map(String).join(" "));

    let reqCount = 0;
    const api = {
      async request(options: {
        operationId?: string;
        method?: string;
        path?: string;
        pathParams?: Record<string, string | number>;
        query?: Record<string, string | number | undefined>;
        headers?: Record<string, string>;
        body?: unknown;
        rawBody?: boolean;
        contentType?: string;
      }) {
        reqCount++;
        if (reqCount > maxRequests) throw new Error("Exceeded request budget for one execute() run");

        let method = options.method;
        let path = options.path;
        if (options.operationId) {
          const op = spec.operationMap[options.operationId];
          if (!op) throw new Error("Unknown operationId: " + options.operationId);
          method = op.method.toUpperCase();
          path = op.path;
        }
        if (!method || !path) throw new Error("Provide operationId or method+path");

        if (options.pathParams) {
          for (const [k, v] of Object.entries(options.pathParams)) {
            path = path.replace("{" + k + "}", encodeURIComponent(String(v)));
          }
        }

        const u = new URL(spec.baseUrl + path);
        if (options.query) {
          for (const [k, v] of Object.entries(options.query)) {
            if (v !== undefined) u.searchParams.set(k, String(v));
          }
        }

        const headers = new Headers(options.headers || {});
        // Inject auth
        if (authValue) {
          headers.set(meta.authHeaderName, `${meta.authPrefix}${authValue}`.trim());
        }

        let body: string | undefined;
        if (options.rawBody) body = options.body as string;
        else if (options.body !== undefined) {
          headers.set("content-type", options.contentType || "application/json");
          body = JSON.stringify(options.body);
        }

        // Restrict to allowed hosts
        if (!meta.allowedHosts.map((h) => h.toLowerCase()).includes(u.hostname.toLowerCase())) {
          throw new Error(`Forbidden host: ${u.hostname}. Allowed: ${meta.allowedHosts.join(", ")}`);
        }

        const resp = await fetch(u.toString(), { method, headers, body });
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
    };

    try {
      const fn = new AsyncFunction("api", `return (${normalizeCode(code)})();`);
      const result = await Promise.race([
        fn(api),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Execution timed out (10s)")), 10000)),
      ]);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e instanceof Error ? e.message : String(e), logs };
    } finally {
      console.log = origLog;
    }
  };
}
