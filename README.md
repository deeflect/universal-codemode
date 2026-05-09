<p align="center">
  <h1 align="center">codemode</h1>
</p>

<p align="center">
  <strong>Give your AI agent access to any API in ~1,000 tokens</strong>
</p>

<p align="center">
  <a href="https://cm.deeflect.com"><img src="https://img.shields.io/badge/Live-cm.deeflect.com-black?style=flat-square" alt="Live" /></a>
  <img src="https://img.shields.io/badge/APIs-56-blue?style=flat-square" alt="56 APIs" />
  <img src="https://img.shields.io/badge/protocol-MCP-purple?style=flat-square" alt="MCP" />
  <img src="https://img.shields.io/badge/language-TypeScript-blue?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT" />
</p>

<p align="center">
  <a href="https://cm.deeflect.com">Docs</a> · <a href="https://blog.deeflect.com/09-mcp-server/">Blog Post</a> · <a href="https://deeflect.com">Author</a>
</p>

---

Most MCP servers flood your context window with hundreds of tool definitions. codemode gives your AI two tools instead: `search` and `execute`, built on [Cloudflare's Code Mode pattern](https://blog.cloudflare.com/code-mode-mcp/). Your AI writes code to search API docs and make calls. That's it.

56 APIs out of the box. GitHub, Stripe, OpenAI, Slack, Notion, Discord, and 50 more.

---

## How it works

```
Your AI agent → "find the endpoint to create a repo"
  → search() → AI writes JS to query the API spec → returns matching endpoints

Your AI agent → "create a repo called my-project"  
  → execute() → AI writes JS to call the API → your server proxies the request → returns result
```

Traditional MCP servers expose hundreds of tools per API. A single large API can eat 500K+ tokens just for tool definitions, which is more than most context windows.

codemode exposes **2 tools total**, regardless of API size. The AI figures out the rest by writing code against a searchable spec.

| | Traditional MCP | codemode |
|---|---|---|
| Tools per API | 100-500+ | **2** |
| Tokens used | 100K-1M+ | **~1,000** |
| Adding a new API | Build a new MCP server | **Point at an OpenAPI spec** |

---

## Quick start

### Use hosted (just connect)

Add to your MCP config:

**Claude Code** (`~/.claude/mcp.json`):
```json
{
  "servers": {
    "github": {
      "url": "https://cm.dee.ad/mcp?api_id=github",
      "headers": { "x-api-key": "your_github_token" }
    }
  }
}
```

**Cursor** → Settings → MCP → Add server → paste the URL.

**OpenClaw** → Add to your MCP config with the same URL + header.

Your AI now has full GitHub API access. Ask it anything.

### Self-hosted (run locally)

```bash
npm install -g universal-codemode-mcp

# Run with any supported API
universal-codemode-mcp serve --spec github
```

Add to Claude Code as a local server:
```json
{
  "servers": {
    "github": {
      "command": "universal-codemode-mcp",
      "args": ["serve", "--spec", "github"],
      "env": { "UCMCP_AUTH_VALUE": "your_github_token" }
    }
  }
}
```

---

## Supported APIs (56)

<details>
<summary><strong>Tier 1 — Core</strong></summary>

| API | Endpoints | Auth |
|---|---:|---|
| GitHub | 15 | Bearer |
| Stripe | 12 | Bearer |
| OpenAI | 12 | Bearer |
| Anthropic | 10 | x-api-key |
| Google (Gmail, Calendar, Drive, Sheets) | 40 | OAuth2 |
| Slack | 10 | Bearer |
| Discord | 10 | Bot token |
| Notion | 10 | Bearer |
| Twilio | 10 | Basic |
| SendGrid | 10 | Bearer |
| AWS (S3, Lambda, DynamoDB) | 30 | SigV4 |
| Cloudflare | 10 | Bearer |
| Vercel | 10 | Bearer |
| Supabase | 10 | Bearer |
| Firebase | 10 | OAuth2 |

</details>

<details>
<summary><strong>Tier 2 — Popular</strong></summary>

| API | Endpoints | Auth |
|---|---:|---|
| Shopify | 10 | Access Token |
| HubSpot | 10 | Bearer |
| Salesforce | 10 | OAuth2 |
| Jira | 10 | Basic/OAuth2 |
| Linear | 10 | Bearer |
| Airtable | 10 | Bearer |
| Figma | 10 | Bearer |
| Spotify | 10 | Bearer |
| X (Twitter) | 10 | Bearer |
| Reddit | 10 | OAuth2 |
| YouTube | 10 | API key |
| Telegram | 10 | Bot token |

</details>

<details>
<summary><strong>Tier 3 — Developer Tools</strong></summary>

| API | Endpoints | Auth |
|---|---:|---|
| Docker Hub | 10 | Bearer |
| npm Registry | 10 | Bearer |
| PyPI | 10 | None |
| Postman | 10 | API key |
| Sentry | 10 | Bearer |
| Datadog | 10 | API key |
| PagerDuty | 10 | Token |
| Grafana | 10 | Bearer |
| MongoDB Atlas | 10 | Digest |
| Elasticsearch | 10 | Basic |

</details>

<details>
<summary><strong>Tier 4 — Services</strong></summary>

| API | Endpoints | Auth |
|---|---:|---|
| OpenWeatherMap | 10 | API key |
| NewsAPI | 10 | API key |
| CoinGecko | 10 | None/API key |
| Alpha Vantage | 10 | API key |
| Unsplash | 10 | Client-ID |
| Giphy | 10 | API key |
| Mapbox | 10 | Token |
| Google Maps | 10 | API key |
| Calendly | 10 | Bearer |
| Zoom | 10 | Bearer |
| Intercom | 10 | Bearer |
| Zendesk | 10 | Basic |
| Mailchimp | 10 | API key |
| ConvertKit | 10 | Bearer |

</details>

---

## Deploy your own

Deploy to Cloudflare Workers (free tier handles 100K requests/day):

```bash
# Clone
git clone https://github.com/deeflect/universal-codemode.git
cd codemode

# Install
npm install

# Setup Cloudflare resources
wrangler login
wrangler kv namespace create SPEC_CACHE    # copy ID to wrangler.jsonc
wrangler r2 bucket create codemode-specs
wrangler secret put ADMIN_TOKEN            # set your admin password

# Deploy
npm run deploy

# Seed all 56 APIs
npm run seed-catalog
```

Your server is live at `https://your-worker.workers.dev/mcp?api_id=<api>`.

---

## Register custom APIs

Have an OpenAPI spec? Register it:

```bash
curl -X POST https://your-server/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiId": "my-api",
    "sourceUrl": "https://example.com/openapi.json",
    "baseUrl": "https://api.example.com",
    "allowedHosts": ["api.example.com"],
    "auth": { "headerName": "authorization", "prefix": "Bearer " }
  }'
```

Supports JSON and YAML specs. Auto-resolves `$ref`s. Specs refresh weekly via cron.

---

## How auth works

Your API keys never touch our servers. You pass credentials via the `x-api-key` header on each MCP request. The server injects them into the outbound API call and drops them immediately. Nothing is stored.

```
User → x-api-key: sk_live_xxx → codemode server → Authorization: Bearer sk_live_xxx → Stripe API
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  AI Agent (Claude, Cursor, Codex, OpenClaw) │
│  Gets 2 tools: search() + execute()        │
└──────────────┬──────────────────────────────┘
               │ MCP (JSON-RPC)
┌──────────────▼──────────────────────────────┐
│  codemode server (Cloudflare Worker)        │
│                                             │
│  search(code)                               │
│  → Sandbox (no network)                     │
│  → Runs user code against preprocessed spec │
│  → Returns matching endpoints/schemas       │
│                                             │
│  execute(code)                              │
│  → Sandbox (restricted network)             │
│  → Runs user code with api.request()        │
│  → GlobalOutbound: host allowlist + auth    │
│  → Returns API response                    │
│                                             │
│  Spec storage: R2 + KV                      │
│  Weekly auto-refresh via cron               │
└─────────────────────────────────────────────┘
```

---

## Credits

Powered by [`@cloudflare/codemode`](https://www.npmjs.com/package/@cloudflare/codemode) — the official Code Mode SDK. Built on [Cloudflare's Code Mode](https://blog.cloudflare.com/code-mode-mcp/) pattern and their [Agents SDK](https://github.com/cloudflare/agents) + [MCP server](https://github.com/cloudflare/mcp). The Cloudflare team did the hard work of figuring out this approach and open-sourcing it.

---

## License

MIT. Do whatever you want with it.

---

### Made by

Made by [Dee](https://deeflect.com) — AI Engineer + Product Designer in LA. Built codemode after watching too many MCP servers nuke a context window for no reason.

The Cloudflare team did the hard part. I just packaged the result with 56 APIs and a casual attitude. Star if it saved your context, open an issue if it didn't.

Need MCP work or AI integrations shipped fast? [dee.agency](https://dee.agency?utm_source=codemode&utm_medium=readme).

[deeflect.com](https://deeflect.com) · [Wikidata](https://www.wikidata.org/entity/Q138828544) · [LinkedIn](https://www.linkedin.com/in/dkargaev/) · [X](https://x.com/deeflectcom)
