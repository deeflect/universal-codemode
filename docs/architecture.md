# Architecture

## Hosted (Cloudflare)

1. `POST /register` ingests OpenAPI (JSON or YAML), validates, resolves local refs, normalizes operations, stores:
   - R2: processed spec JSON text
   - KV: API metadata + `apis:list`
2. `POST /mcp?api_id=...` loads metadata + raw spec text from R2.
3. Per request it creates MCP server with two tools:
   - `search(code)` sandbox: no network (`globalOutbound: null`)
   - `execute(code)` sandbox: `api.request()` over `GlobalOutbound`
4. `GlobalOutbound` enforces host allowlist and injects user auth header.

## Data model

- `ProcessedSpec`: compact search/execute dataset
- `operationMap`: operationId -> method/path map for execute helper
- `ApiMetadata`: auth profile, source URL, hash, endpoint count, warning list

## Catalog + refresh

- `catalog/*.json`: prefilled providers (20+)
- `npm run seed-catalog`: bulk register all entries
- weekly cron (`wrangler triggers.crons`) re-fetches `sourceUrl`, recomputes hash, updates only changed specs.

## Local/self-hosted option

`npx universal-codemode-mcp serve` starts stdio MCP server in Node:
- local spec store: `.ucmcp/specs/*.json`
- sandbox: Node worker threads
- same tools (`search`, `execute`) and request helper shape
