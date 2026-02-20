export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  LOADER: WorkerLoader;
  GLOBAL_OUTBOUND: Fetcher;
  SPEC_BUCKET: R2Bucket;
  SPEC_CACHE: KVNamespace;
  ADMIN_TOKEN: string;
  MAX_EXECUTE_REQUESTS?: string;
  MAX_RESPONSE_CHARS?: string;
  MCP_RATE_LIMIT?: RateLimiter;
}

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

export interface NormalizedOperation {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: unknown;
}

export interface ProcessedSpec {
  apiId: string;
  title: string;
  version: string;
  baseUrl: string;
  allowedHosts: string[];
  warnings?: string[];
  operations: NormalizedOperation[];
  operationMap: Record<string, { method: string; path: string }>;
  paths: Record<string, Record<string, Omit<NormalizedOperation, "path" | "method">>>;
  schemas: Record<string, unknown>;
}

export interface RegisterPayload {
  apiId: string;
  sourceUrl?: string;
  spec?: Record<string, unknown> | string;
  baseUrl?: string;
  allowedHosts?: string[];
  auth?: {
    headerName?: string;
    prefix?: string;
  };
}

export interface ApiMetadata {
  apiId: string;
  title: string;
  version: string;
  baseUrl: string;
  allowedHosts: string[];
  authHeaderName: string;
  authPrefix: string;
  objectKey: string;
  sourceUrl?: string;
  specHash?: string;
  endpointCount?: number;
  warnings?: string[];
}

export interface CatalogEntry {
  apiId: string;
  sourceUrl: string;
  baseUrl: string;
  allowedHosts: string[];
  auth?: {
    headerName?: string;
    prefix?: string;
  };
}
