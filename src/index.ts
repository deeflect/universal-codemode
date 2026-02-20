import { WorkerEntrypoint } from "cloudflare:workers";
import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./mcp";
import { ingestSpec, refreshCatalogEntry } from "./spec";
import type { ApiMetadata, Env, ProcessedSpec, RegisterPayload } from "./types";

type Ctx = { Bindings: Env };

export class GlobalOutbound extends WorkerEntrypoint<Env, { allowedHosts: string[]; authHeader: string; authValue: string; authPrefix: string }> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const hosts = this.ctx.props.allowedHosts.map((h) => h.toLowerCase());
    if (!hosts.includes(url.hostname.toLowerCase())) {
      return new Response(`Forbidden host: ${url.hostname}`, { status: 403 });
    }
    const headers = new Headers(request.headers);
    headers.set(this.ctx.props.authHeader, `${this.ctx.props.authPrefix}${this.ctx.props.authValue}`.trim());
    return fetch(new Request(request, { headers }));
  }
}

async function loadApi(env: Env, apiId: string): Promise<{ spec: ProcessedSpec; rawSpecText: string; meta: ApiMetadata }> {
  const metaRaw = await env.SPEC_CACHE.get(`api:${apiId}:meta`);
  if (!metaRaw) throw new Error(`Unknown apiId '${apiId}'. Register it via POST /register first.`);
  const meta = JSON.parse(metaRaw) as ApiMetadata;
  const obj = await env.SPEC_BUCKET.get(meta.objectKey);
  if (!obj) throw new Error(`Spec object missing for ${apiId}`);
  const rawSpecText = await obj.text();
  return { meta, rawSpecText, spec: JSON.parse(rawSpecText) as ProcessedSpec };
}

function requireAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${env.ADMIN_TOKEN}`;
}

async function listApis(env: Env): Promise<ApiMetadata[]> {
  const list = JSON.parse((await env.SPEC_CACHE.get("apis:list")) ?? "[]") as string[];
  const apis = await Promise.all(
    list.map(async (id) => {
      const raw = await env.SPEC_CACHE.get(`api:${id}:meta`);
      return raw ? (JSON.parse(raw) as ApiMetadata) : null;
    })
  );
  return apis.filter(Boolean) as ApiMetadata[];
}

function landingPage(origin: string, apis: ApiMetadata[]): string {
  const rows = apis
    .map(
      (a) => `<tr><td>${a.apiId}</td><td>${a.title}</td><td>${a.version}</td><td>${a.baseUrl}</td><td>${a.endpointCount ?? "-"}</td><td><code>${origin}/mcp?api_id=${a.apiId}</code></td></tr>`
    )
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Universal Code Mode MCP</title>
  <style>body{font-family:Inter,system-ui,Arial,sans-serif;max-width:1100px;margin:40px auto;padding:0 16px;color:#111}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e5e7eb;padding:10px;text-align:left}code{background:#f3f4f6;padding:2px 6px;border-radius:4px}.muted{color:#6b7280}</style></head>
  <body><h1>Universal Code Mode MCP</h1><p class="muted">Registered APIs: ${apis.length}</p>
  <table><thead><tr><th>API ID</th><th>Name</th><th>Version</th><th>Base URL</th><th>Endpoints</th><th>MCP URL</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

const app = new Hono<Ctx>();

app.get("/", async (c) => {
  const apis = await listApis(c.env);
  return c.html(landingPage(new URL(c.req.url).origin, apis));
});

app.get("/health", (c) => c.json({ ok: true, service: "universal-codemode-mcp" }));

app.post("/register", async (c) => {
  if (!requireAdmin(c.req.raw, c.env)) return c.json({ error: "unauthorized" }, 401);

  try {
    const payload = (await c.req.json()) as RegisterPayload;
    const { metadata, processedText } = await ingestSpec(payload);

    await Promise.all([
      c.env.SPEC_BUCKET.put(metadata.objectKey, processedText, {
        httpMetadata: { contentType: "application/json" }
      }),
      c.env.SPEC_CACHE.put(`api:${payload.apiId}:meta`, JSON.stringify(metadata)),
      c.env.SPEC_CACHE.put(
        "apis:list",
        JSON.stringify(Array.from(new Set([...(JSON.parse((await c.env.SPEC_CACHE.get("apis:list")) ?? "[]") as string[]), payload.apiId])))
      )
    ]);

    return c.json({
      ok: true,
      api: { id: metadata.apiId, title: metadata.title, version: metadata.version, baseUrl: metadata.baseUrl, warnings: metadata.warnings ?? [] }
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Unknown error" }, 400);
  }
});

app.get("/apis", async (c) => c.json({ apis: await listApis(c.env) }));

app.post("/mcp", async (c) => {
  const apiId = c.req.query("api_id") || c.req.header("x-api-id");
  if (!apiId) return c.json({ error: "Missing api_id (query) or x-api-id header" }, 400);

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  if (c.env.MCP_RATE_LIMIT) {
    const rate = await c.env.MCP_RATE_LIMIT.limit({ key: ip });
    if (!rate.success) return c.json({ error: "Rate limit exceeded" }, 429);
  } else {
    const key = `rl:${ip}:${Math.floor(Date.now() / 60000)}`;
    const count = Number((await c.env.SPEC_CACHE.get(key)) ?? "0") + 1;
    await c.env.SPEC_CACHE.put(key, String(count), { expirationTtl: 70 });
    if (count > 100) return c.json({ error: "Rate limit exceeded" }, 429);
  }

  const { spec, rawSpecText, meta } = await loadApi(c.env, apiId);

  const authValue = c.req.header("x-api-key") ?? c.req.header("authorization");
  if (!authValue) return c.json({ error: "Missing user API credential: send x-api-key (raw token) or Authorization (full value)" }, 401);

  const server = createMcpServer(c.env, c.executionCtx, spec, rawSpecText, meta, authValue);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    retryInterval: 1000
  });
  await server.connect(transport);
  const response = await transport.handleRequest(c.req.raw);
  c.executionCtx.waitUntil(transport.close());
  return response;
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const apis = await listApis(env);
        for (const meta of apis) {
          try {
            const updated = await refreshCatalogEntry(meta);
            if (updated.changed && updated.metadata && updated.processedText) {
              await Promise.all([
                env.SPEC_BUCKET.put(updated.metadata.objectKey, updated.processedText, {
                  httpMetadata: { contentType: "application/json" }
                }),
                env.SPEC_CACHE.put(`api:${meta.apiId}:meta`, JSON.stringify(updated.metadata))
              ]);
            }
          } catch (err) {
            console.error(`catalog refresh failed for ${meta.apiId}`, err);
          }
        }
      })()
    );
  }
};
