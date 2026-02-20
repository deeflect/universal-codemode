# Security

## Core controls

- **Search isolation:** `globalOutbound: null` so search code cannot access network.
- **Execute host policy:** outbound calls are blocked unless hostname is in registered `allowedHosts`.
- **Auth injection server-side:** user credentials are taken from MCP request headers and added at outbound layer.
- **Timeouts:** both search and execute sandbox runs enforce a 10s timeout.
- **Request budget:** execute helper enforces `MAX_EXECUTE_REQUESTS` per run.
- **Response bounds:** results are truncated with explicit truncation marker.
- **Rate limiting:** `/mcp` enforces 100 req/min/IP.

## Admin and secrets

- `/register` is protected by `Authorization: Bearer <ADMIN_TOKEN>`.
- `ADMIN_TOKEN` must be configured as a Wrangler secret (`wrangler secret put ADMIN_TOKEN`), not plaintext vars.

## Spec ingestion hardening

- Validates OpenAPI shape (`openapi/swagger` + `paths`).
- Supports JSON and YAML source documents.
- Local `$ref` is resolved recursively.
- External `$ref` is not yet dereferenced; warnings are recorded and surfaced to callers.

## Known limitations

- External `$ref` support is warning-only (future: json-schema-ref-parser full dereference).
- Cloudflare `ctx.exports` pattern for dynamic outbound service is runtime-supported but lightly documented.
