import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createExecuteExecutor, createSearchExecutor } from "./executor";
import { truncateResponse } from "./truncate";
import type { ApiMetadata, Env, ProcessedSpec } from "./types";

const SEARCH_TYPES = `
declare const spec: {
  apiId: string;
  title: string;
  version: string;
  paths: Record<string, Record<string, {
    operationId: string;
    summary?: string;
    description?: string;
    tags: string[];
    parameters?: unknown[];
    requestBody?: unknown;
    responses?: Record<string, unknown>;
  }>>;
  operations: Array<{
    operationId: string;
    method: string;
    path: string;
    summary?: string;
    tags: string[];
  }>;
  schemas: Record<string, unknown>;
};`;

const EXECUTE_TYPES = `
declare const api: {
  request(options: {
    operationId?: string;
    method?: string;
    path?: string;
    pathParams?: Record<string, string | number>;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    body?: unknown;
    contentType?: string;
    rawBody?: boolean;
  }): Promise<{ status: number; ok: boolean; headers: Record<string, string>; data: unknown }>;
};`;

function withLogsAndWarnings(base: string, logs?: string[], warnings?: string[]): string {
  const parts = [base];
  if (logs?.length) parts.push(`\n\n[Logs]\n${logs.join("\n")}`);
  if (warnings?.length) parts.push(`\n\n[Spec warnings]\n${warnings.join("\n")}`);
  return parts.join("");
}

export function createMcpServer(
  env: Env,
  ctx: ExecutionContext,
  spec: ProcessedSpec,
  rawSpecText: string,
  meta: ApiMetadata,
  authValue: string
): McpServer {
  const server = new McpServer({ name: `universal-codemode-${meta.apiId}`, version: "0.1.0" });
  const searchExecutor = createSearchExecutor(env);
  const executeExecutor = createExecuteExecutor(env, ctx as ExecutionContext & { exports: any });
  const maxChars = Number(env.MAX_RESPONSE_CHARS ?? "40000");
  const maxReq = Number(env.MAX_EXECUTE_REQUESTS ?? "20");

  server.registerTool(
    "search",
    {
      description: `Search preprocessed OpenAPI spec for ${meta.apiId}.\n${SEARCH_TYPES}\nWrite an async arrow function. Return compact results like {operationId, method, path, summary}.`,
      inputSchema: {
        code: z.string()
      }
    },
    async ({ code }) => {
      const result = await searchExecutor(code, rawSpecText);
      if (result.error) return { isError: true, content: [{ type: "text", text: `Error: ${result.error}` }] };
      const text = withLogsAndWarnings(truncateResponse(result.result, maxChars), result.logs, spec.warnings);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "execute",
    {
      description: `Execute API calls for ${meta.apiId}. Use search first, then call api.request.\n${EXECUTE_TYPES}\nAuth is injected server-side from request headers.`,
      inputSchema: {
        code: z.string()
      }
    },
    async ({ code }) => {
      const result = await executeExecutor(code, spec, meta, authValue, maxReq);
      if (result.error) return { isError: true, content: [{ type: "text", text: `Error: ${result.error}` }] };
      const text = withLogsAndWarnings(truncateResponse(result.result, maxChars), result.logs, spec.warnings);
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
}
