import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createCodeTool } from "@cloudflare/codemode/ai";
import { z } from "zod";
import { createExecuteExecutor, createSearchExecutor, makeApiRequestFunction } from "./executor";
import { truncateResponse } from "./truncate";
import type { ApiMetadata, Env, ProcessedSpec } from "./types";

const SEARCH_TYPES = `
declare const codemode: {
  getSpec(input: {}): Promise<{
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
  }>;
};`;

const EXECUTE_TYPES = `
declare const codemode: {
  request(input: {
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
  _rawSpecText: string,
  meta: ApiMetadata,
  authValue: string
): McpServer {
  const server = new McpServer({ name: `universal-codemode-${meta.apiId}`, version: "0.1.0" });
  const searchExecutor = createSearchExecutor(env);
  const executeExecutor = createExecuteExecutor(env, ctx);
  const maxChars = Number(env.MAX_RESPONSE_CHARS ?? "40000");
  const maxReq = Number(env.MAX_EXECUTE_REQUESTS ?? "20");

  const searchTool = createCodeTool({
    executor: searchExecutor,
    tools: {
      getSpec: {
        description: `Returns the processed OpenAPI spec for ${meta.apiId}.`,
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
    description: `Search preprocessed OpenAPI spec for ${meta.apiId}.\n${SEARCH_TYPES}\nWrite an async arrow function using codemode.getSpec({}) and return compact results like {operationId, method, path, summary}.`,
  });

  const executeTool = createCodeTool({
    executor: executeExecutor,
    tools: {
      request: {
        description: `Execute one HTTP request against ${meta.apiId}.`,
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
        execute: makeApiRequestFunction(spec, meta, authValue, maxReq),
      },
    },
    description: `Execute API calls for ${meta.apiId}. Use search first, then call codemode.request(...).\n${EXECUTE_TYPES}\nAuth is injected server-side from request headers.`,
  });

  server.registerTool("search", {
    description: searchTool.description,
    inputSchema: { code: z.string() },
  }, async ({ code }: { code: string }) => {
    try {
      const out = (await (searchTool.execute as NonNullable<typeof searchTool.execute>)({ code }, { toolCallId: "search", messages: [] })) as {
        result: unknown;
        logs?: string[];
      };
      const text = withLogsAndWarnings(truncateResponse(out.result, maxChars), out.logs, spec.warnings);
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
    }
  });

  server.registerTool("execute", {
    description: executeTool.description,
    inputSchema: { code: z.string() },
  }, async ({ code }: { code: string }) => {
    try {
      const out = (await (executeTool.execute as NonNullable<typeof executeTool.execute>)({ code }, { toolCallId: "execute", messages: [] })) as {
        result: unknown;
        logs?: string[];
      };
      const text = withLogsAndWarnings(truncateResponse(out.result, maxChars), out.logs, spec.warnings);
      return { content: [{ type: "text", text }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
    }
  });

  return server;
}
