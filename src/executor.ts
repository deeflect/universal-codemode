import { DynamicWorkerExecutor, type ExecuteResult, type Executor } from "@cloudflare/codemode";
import type { ApiMetadata, Env, ProcessedSpec } from "./types";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Execution timed out (${Math.floor(timeoutMs / 1000)}s)`)), timeoutMs)),
  ]);
}

export class NodeExecutor implements Executor {
  constructor(private readonly timeoutMs = 10000) {}

  async execute(code: string, fns: Record<string, (...args: unknown[]) => Promise<unknown>>): Promise<ExecuteResult> {
    const logs: string[] = [];
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    const capture = (...a: unknown[]) => logs.push(a.map(String).join(" "));
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
            return async (input: unknown) => fn(input);
          },
        }
      ) as Record<string, (input: unknown) => Promise<unknown>>;

      const fn = new AsyncFunction("codemode", `return (${code})();`);
      const result = await withTimeout(fn(codemode), this.timeoutMs);
      return { result, logs };
    } catch (e) {
      return { result: undefined, error: e instanceof Error ? e.message : String(e), logs };
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    }
  }
}

export function createSearchExecutor(env: Env): Executor {
  if (env.LOADER) {
    return new DynamicWorkerExecutor({ loader: env.LOADER, timeout: 10000, globalOutbound: null });
  }
  return new NodeExecutor(10000);
}

export function createExecuteExecutor(env: Env, _ctx: ExecutionContext): Executor {
  if (env.LOADER) {
    return new DynamicWorkerExecutor({ loader: env.LOADER, timeout: 10000, globalOutbound: null });
  }
  return new NodeExecutor(10000);
}

export function makeApiRequestFunction(
  spec: ProcessedSpec,
  meta: ApiMetadata,
  authValue: string,
  maxRequests: number
): (input: unknown) => Promise<unknown> {
  let reqCount = 0;

  return async (input: unknown) => {
    const options = (input ?? {}) as {
      operationId?: string;
      method?: string;
      path?: string;
      pathParams?: Record<string, string | number>;
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      body?: unknown;
      rawBody?: boolean;
      contentType?: string;
    };

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
    if (authValue) {
      headers.set(meta.authHeaderName, `${meta.authPrefix}${authValue}`.trim());
    }

    let body: string | undefined;
    if (options.rawBody) body = options.body as string;
    else if (options.body !== undefined) {
      headers.set("content-type", options.contentType || "application/json");
      body = JSON.stringify(options.body);
    }

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
  };
}
