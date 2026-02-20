import yaml from "js-yaml";
import type { ApiMetadata, CatalogEntry, NormalizedOperation, ProcessedSpec, RegisterPayload } from "./types";

const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;
type JsonRecord = Record<string, unknown>;

function parseSpecText(text: string): JsonRecord {
  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    const parsed = yaml.load(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Spec is not valid JSON or YAML");
    return parsed as JsonRecord;
  }
}

function hasExternalRef(value: string): boolean {
  return !value.startsWith("#/");
}

function resolveRefs(obj: unknown, root: JsonRecord, warnings: Set<string>, seen = new Set<string>()): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((x) => resolveRefs(x, root, warnings, seen));

  const record = obj as JsonRecord;
  if (typeof record.$ref === "string") {
    if (hasExternalRef(record.$ref)) {
      warnings.add(`External $ref not resolved: ${record.$ref}`);
      return record;
    }
    const ref = record.$ref;
    if (seen.has(ref)) return { $circular: ref };
    seen.add(ref);
    const target = ref.slice(2).split("/").reduce<unknown>((acc, key) => (acc as JsonRecord)?.[key], root);
    return resolveRefs(target, root, warnings, seen);
  }

  const out: JsonRecord = {};
  for (const [k, v] of Object.entries(record)) out[k] = resolveRefs(v, root, warnings, new Set(seen));
  return out;
}

function mergeParameters(pathParams: unknown, opParams: unknown): unknown[] {
  const p = Array.isArray(pathParams) ? pathParams : [];
  const o = Array.isArray(opParams) ? opParams : [];
  const byKey = new Map<string, unknown>();
  for (const item of p) {
    const r = item as JsonRecord;
    byKey.set(`${String(r.name ?? "")}::${String(r.in ?? "")}`, item);
  }
  for (const item of o) {
    const r = item as JsonRecord;
    byKey.set(`${String(r.name ?? "")}::${String(r.in ?? "")}`, item);
  }
  return [...byKey.values()];
}

function normalizeSpec(raw: JsonRecord, payload: RegisterPayload): ProcessedSpec {
  if (!raw.openapi && !raw.swagger) {
    throw new Error("Not a valid OpenAPI spec: missing 'openapi' or 'swagger'");
  }
  if (!raw.paths || typeof raw.paths !== "object") {
    throw new Error("Not a valid OpenAPI spec: missing 'paths' object");
  }

  const warnings = new Set<string>();
  const info = (raw.info ?? {}) as JsonRecord;
  const title = String(info.title ?? payload.apiId);
  const version = String(info.version ?? "0.0.0");

  const serverUrl = payload.baseUrl ?? (((raw.servers as JsonRecord[] | undefined)?.[0]?.url as string | undefined) ?? "");
  if (!serverUrl) throw new Error("Missing baseUrl. Provide payload.baseUrl or OpenAPI servers[0].url");
  const baseUrl = new URL(serverUrl).toString().replace(/\/$/, "");

  const allowedHosts = (payload.allowedHosts?.length ? payload.allowedHosts : [new URL(baseUrl).hostname]).map((h) => h.toLowerCase());

  const paths = raw.paths as Record<string, JsonRecord>;
  const operations: NormalizedOperation[] = [];
  const operationMap: ProcessedSpec["operationMap"] = {};
  const pathMap: ProcessedSpec["paths"] = {};

  for (const [path, pathItem] of Object.entries(paths)) {
    pathMap[path] = {};
    for (const method of METHODS) {
      const op = pathItem?.[method] as JsonRecord | undefined;
      if (!op) continue;
      const opId = String(op.operationId ?? `${method}_${path.replace(/[^a-zA-Z0-9]+/g, "_")}`);
      const normalized: NormalizedOperation = {
        operationId: opId,
        method,
        path,
        summary: op.summary as string | undefined,
        description: op.description as string | undefined,
        tags: (op.tags as string[] | undefined) ?? [],
        parameters: resolveRefs(mergeParameters(pathItem.parameters, op.parameters), raw, warnings) as unknown[],
        requestBody: resolveRefs(op.requestBody, raw, warnings),
        responses: resolveRefs(op.responses, raw, warnings) as Record<string, unknown> | undefined,
        security: resolveRefs(op.security ?? raw.security, raw, warnings)
      };
      operations.push(normalized);
      operationMap[opId] = { method, path };
      pathMap[path][method] = {
        operationId: opId,
        summary: normalized.summary,
        description: normalized.description,
        tags: normalized.tags,
        parameters: normalized.parameters,
        requestBody: normalized.requestBody,
        responses: normalized.responses,
        security: normalized.security
      };
    }
    if (!Object.keys(pathMap[path]).length) delete pathMap[path];
  }

  return {
    apiId: payload.apiId,
    title,
    version,
    baseUrl,
    allowedHosts,
    warnings: [...warnings],
    operations,
    operationMap,
    paths: pathMap,
    schemas: resolveRefs((raw.components as JsonRecord | undefined)?.schemas ?? {}, raw, warnings) as Record<string, unknown>
  };
}

async function fetchSpec(sourceUrl: string): Promise<{ raw: JsonRecord; text: string }> {
  const r = await fetch(sourceUrl);
  if (!r.ok) throw new Error(`Failed to fetch spec from URL (${r.status})`);
  const text = await r.text();
  const raw = parseSpecText(text);
  return { raw, text };
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ingestSpec(payload: RegisterPayload): Promise<{ processed: ProcessedSpec; metadata: ApiMetadata; processedText: string }> {
  if (!payload.apiId || !/^[a-zA-Z0-9_-]{2,64}$/.test(payload.apiId)) {
    throw new Error("apiId must match /^[a-zA-Z0-9_-]{2,64}$/");
  }

  const source = payload.spec
    ? typeof payload.spec === "string"
      ? { raw: parseSpecText(payload.spec), text: payload.spec }
      : { raw: payload.spec as JsonRecord, text: JSON.stringify(payload.spec) }
    : await fetchSpec(payload.sourceUrl ?? "");

  const processed = normalizeSpec(source.raw, payload);
  const processedText = JSON.stringify(processed);
  const objectKey = `apis/${payload.apiId}/spec.json`;
  const metadata: ApiMetadata = {
    apiId: payload.apiId,
    title: processed.title,
    version: processed.version,
    baseUrl: processed.baseUrl,
    allowedHosts: processed.allowedHosts,
    authHeaderName: payload.auth?.headerName ?? "authorization",
    authPrefix: payload.auth?.prefix ?? "Bearer ",
    objectKey,
    sourceUrl: payload.sourceUrl,
    specHash: await sha256(processedText),
    endpointCount: processed.operations.length,
    warnings: processed.warnings
  };

  return { processed, metadata, processedText };
}

export async function refreshCatalogEntry(meta: ApiMetadata): Promise<{ changed: boolean; processedText?: string; metadata?: ApiMetadata }> {
  if (!meta.sourceUrl) return { changed: false };
  const { raw } = await fetchSpec(meta.sourceUrl);
  const { processed, metadata, processedText } = await ingestSpec({
    apiId: meta.apiId,
    sourceUrl: meta.sourceUrl,
    baseUrl: meta.baseUrl,
    allowedHosts: meta.allowedHosts,
    auth: { headerName: meta.authHeaderName, prefix: meta.authPrefix },
    spec: raw
  });
  const changed = metadata.specHash !== meta.specHash;
  return { changed, processedText: changed ? processedText : undefined, metadata: changed ? metadata : undefined };
}

export function buildCatalogPayload(entry: CatalogEntry): RegisterPayload {
  return {
    apiId: entry.apiId,
    sourceUrl: entry.sourceUrl,
    baseUrl: entry.baseUrl,
    allowedHosts: entry.allowedHosts,
    auth: entry.auth
  };
}
