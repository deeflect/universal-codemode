export const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>codemode — Give your AI agent access to any API in ~1,000 tokens</title>
  <meta name="description" content="Instead of flooding your context window with hundreds of tool definitions, codemode gives your AI just two tools — search and execute. 56 APIs ready out of the box.">
  <meta property="og:title" content="codemode — Any API. Two tools. ~1,000 tokens.">
  <meta property="og:description" content="Give your AI agent access to any API in ~1,000 tokens. Two tools replace hundreds of tool definitions.">
  <meta property="og:image" content="https://cm.dee.ad/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="codemode — Any API. Two tools. ~1,000 tokens.">
  <meta name="twitter:description" content="Give your AI agent access to any API in ~1,000 tokens.">
  <meta name="twitter:image" content="https://cm.dee.ad/og.jpg">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M4 8l8-4v4l-5.5 3L12 14v4L4 14V8z' fill='%23111'/><path d='M28 8l-8-4v4l5.5 3L20 14v4l8-4V8z' fill='%230066ff'/><circle cx='16' cy='20' r='3' fill='%23111'/><path d='M16 23v5' stroke='%230066ff' stroke-width='2' stroke-linecap='round'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --bg: #ffffff;
      --fg: #111111;
      --muted: #666666;
      --border: #e5e5e5;
      --code-bg: #fafafa;
      --accent: #0066ff;
      --accent-subtle: #f0f6ff;
      --max-w: 720px;
    }

    html { scroll-behavior: smooth; font-size: 16px; }
    body {
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* Nav */
    nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .nav-inner {
      max-width: var(--max-w);
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 1rem;
      color: var(--fg);
      text-decoration: none;
    }
    .nav-logo svg { width: 24px; height: 24px; }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a {
      font-size: 0.875rem;
      color: var(--muted);
      text-decoration: none;
      transition: color 150ms;
    }
    .nav-links a:hover { color: var(--fg); }
    .nav-gh {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .nav-gh svg { width: 16px; height: 16px; }

    /* Sections */
    section { padding: 5rem 1.5rem; }
    .container { max-width: var(--max-w); margin: 0 auto; }

    /* Hero */
    .hero { padding: 7rem 1.5rem 5rem; text-align: center; }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
      max-width: 640px;
      margin: 0 auto 1.25rem;
    }
    .hero .subtitle {
      font-size: 1.125rem;
      color: var(--muted);
      max-width: 520px;
      margin: 0 auto 2.5rem;
      line-height: 1.5;
    }
    .hero .subtitle code {
      font-family: var(--font-mono);
      font-size: 0.95em;
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }
    .ctas { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: var(--font-sans);
      border-radius: 6px;
      text-decoration: none;
      transition: all 150ms;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--fg);
      color: var(--bg);
      border-color: var(--fg);
    }
    .btn-primary:hover { background: #333; border-color: #333; }
    .btn-secondary {
      background: var(--bg);
      color: var(--fg);
      border-color: var(--border);
    }
    .btn-secondary:hover { background: var(--code-bg); }
    .hero-stat {
      margin-top: 3rem;
      font-size: 0.875rem;
      color: var(--muted);
    }
    .hero-stat strong { color: var(--fg); }

    /* Section headers */
    .section-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
      margin-bottom: 0.75rem;
    }
    h2 {
      font-size: 1.75rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
    }
    .section-desc {
      color: var(--muted);
      margin-bottom: 2.5rem;
      max-width: 520px;
    }

    /* How it works - flow */
    .flow {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .flow-step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .flow-num {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--muted);
      background: var(--code-bg);
      border: 1px solid var(--border);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .flow-text strong { display: block; margin-bottom: 0.125rem; }
    .flow-text span { color: var(--muted); font-size: 0.9rem; }

    /* Comparison table */
    .comparison {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      margin-top: 2rem;
    }
    .comparison th, .comparison td {
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .comparison th {
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }
    .comparison td:last-child {
      font-weight: 600;
    }
    .comparison .highlight {
      color: var(--accent);
    }

    /* Code blocks */
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      line-height: 1.7;
      margin: 1rem 0;
    }
    pre .comment { color: #999; }
    pre .string { color: #067d17; }
    pre .key { color: #0550ae; }

    /* Tabs for quickstart */
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0;
    }
    .tab {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-family: var(--font-mono);
      color: var(--muted);
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 150ms;
    }
    .tab:hover { color: var(--fg); }
    .tab.active {
      color: var(--fg);
      border-bottom-color: var(--fg);
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* API grid */
    .api-tiers { display: flex; flex-direction: column; gap: 2rem; }
    .tier-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
      user-select: none;
    }
    .tier-header h3 {
      font-size: 0.9375rem;
      font-weight: 600;
    }
    .tier-header .count {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
    }
    .tier-header .chevron {
      transition: transform 200ms;
      color: var(--muted);
    }
    .tier-header.open .chevron { transform: rotate(180deg); }
    .api-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
      padding-top: 1rem;
    }
    .api-grid.collapsed { display: none; }
    .api-item {
      font-size: 0.8125rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: var(--font-mono);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Architecture SVG */
    .arch-svg-wrap {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2rem 1rem;
      overflow-x: auto;
    }
    .arch-svg-wrap svg {
      display: block;
      margin: 0 auto;
      width: 100%;
      max-width: 620px;
      height: auto;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 3rem 1.5rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--muted);
    }
    footer a {
      color: var(--fg);
      text-decoration: none;
    }
    footer a:hover { text-decoration: underline; }
    footer p { margin: 0.375rem 0; }

    /* Fade in */
    .fade-in {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 500ms ease-out, transform 500ms ease-out;
    }
    .fade-in.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Separator */
    .sep { border-top: 1px solid var(--border); }

    /* Mobile */
    @media (max-width: 640px) {
      section { padding: 3.5rem 1.25rem; }
      .hero { padding: 5rem 1.25rem 3.5rem; }
      .nav-links .hide-mobile { display: none; }
      .api-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    }
  </style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <a href="#" class="nav-logo">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8l8-4v4l-5.5 3L12 14v4L4 14V8z" fill="#111"/>
        <path d="M28 8l-8-4v4l5.5 3L20 14v4l8-4V8z" fill="#0066ff"/>
        <circle cx="16" cy="20" r="3" fill="#111"/>
        <path d="M16 23v5" stroke="#0066ff" stroke-width="2" stroke-linecap="round"/>
      </svg>
      codemode
    </a>
    <div class="nav-links">
      <a href="#how-it-works" class="hide-mobile">How it works</a>
      <a href="#apis" class="hide-mobile">APIs</a>
      <a href="#quickstart" class="hide-mobile">Quick start</a>
      <a href="https://github.com/deeflect/universal-codemode" target="_blank" class="nav-gh">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>Give your AI agent access to any API in ~1,000 tokens.</h1>
    <p class="subtitle">Two tools — <code>search</code> and <code>execute</code> — replace hundreds of tool definitions. Your AI writes code to find endpoints and make calls. That's it.</p>
    <div class="ctas">
      <a href="#quickstart" class="btn btn-primary">Get Started</a>
      <a href="https://github.com/deeflect/universal-codemode" target="_blank" class="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        View on GitHub
      </a>
    </div>
    <p class="hero-stat"><strong>56 APIs</strong> ready out of the box — GitHub, Stripe, OpenAI, Slack, Notion, and more.</p>
  </div>
</section>

<!-- How it works -->
<section id="how-it-works" class="sep fade-in">
  <div class="container">
    <p class="section-label">How it works</p>
    <h2>Search. Execute. Done.</h2>
    <p class="section-desc">Your AI writes code to query API specs and make calls. No tool bloat, no context waste.</p>

    <div class="flow">
      <div class="flow-step">
        <div class="flow-num">1</div>
        <div class="flow-text">
          <strong>Ask your AI anything</strong>
          <span>"Find the endpoint to create a GitHub repo"</span>
        </div>
      </div>
      <div class="flow-step">
        <div class="flow-num">2</div>
        <div class="flow-text">
          <strong>search() — AI queries the spec</strong>
          <span>Writes JS to search the preprocessed OpenAPI spec. Returns matching endpoints and schemas. No network access.</span>
        </div>
      </div>
      <div class="flow-step">
        <div class="flow-num">3</div>
        <div class="flow-text">
          <strong>execute() — AI makes the call</strong>
          <span>Writes JS to call the API via a sandboxed proxy. Host allowlist + auth injection. Returns the result.</span>
        </div>
      </div>
    </div>

    <table class="comparison">
      <thead>
        <tr>
          <th></th>
          <th>Traditional MCP</th>
          <th>codemode</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tools per API</td>
          <td>100–500+</td>
          <td class="highlight">2</td>
        </tr>
        <tr>
          <td>Tokens used</td>
          <td>100K–1M+</td>
          <td class="highlight">~1,000</td>
        </tr>
        <tr>
          <td>Adding a new API</td>
          <td>Build a new MCP server</td>
          <td class="highlight">Point at an OpenAPI spec</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- Supported APIs -->
<section id="apis" class="sep fade-in">
  <div class="container">
    <p class="section-label">Supported APIs</p>
    <h2>56 APIs, ready to go</h2>
    <p class="section-desc">From GitHub to Stripe to obscure weather APIs. If it has an OpenAPI spec, codemode can run it.</p>

    <div class="api-tiers">
      <div class="tier">
        <div class="tier-header open" onclick="toggleTier(this)">
          <h3>Tier 1 — Core <span class="count">15 APIs</span></h3>
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>
        </div>
        <div class="api-grid">
          <div class="api-item">GitHub</div>
          <div class="api-item">Stripe</div>
          <div class="api-item">OpenAI</div>
          <div class="api-item">Anthropic</div>
          <div class="api-item">Gmail</div>
          <div class="api-item">Google Cal</div>
          <div class="api-item">Google Drive</div>
          <div class="api-item">Sheets</div>
          <div class="api-item">Slack</div>
          <div class="api-item">Discord</div>
          <div class="api-item">Notion</div>
          <div class="api-item">Twilio</div>
          <div class="api-item">SendGrid</div>
          <div class="api-item">AWS</div>
          <div class="api-item">Cloudflare</div>
          <div class="api-item">Vercel</div>
          <div class="api-item">Supabase</div>
          <div class="api-item">Firebase</div>
        </div>
      </div>

      <div class="tier">
        <div class="tier-header" onclick="toggleTier(this)">
          <h3>Tier 2 — Popular <span class="count">12 APIs</span></h3>
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>
        </div>
        <div class="api-grid collapsed">
          <div class="api-item">Shopify</div>
          <div class="api-item">HubSpot</div>
          <div class="api-item">Salesforce</div>
          <div class="api-item">Jira</div>
          <div class="api-item">Linear</div>
          <div class="api-item">Airtable</div>
          <div class="api-item">Figma</div>
          <div class="api-item">Spotify</div>
          <div class="api-item">X (Twitter)</div>
          <div class="api-item">Reddit</div>
          <div class="api-item">YouTube</div>
          <div class="api-item">Telegram</div>
        </div>
      </div>

      <div class="tier">
        <div class="tier-header" onclick="toggleTier(this)">
          <h3>Tier 3 — Developer Tools <span class="count">10 APIs</span></h3>
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>
        </div>
        <div class="api-grid collapsed">
          <div class="api-item">Docker Hub</div>
          <div class="api-item">npm</div>
          <div class="api-item">PyPI</div>
          <div class="api-item">Postman</div>
          <div class="api-item">Sentry</div>
          <div class="api-item">Datadog</div>
          <div class="api-item">PagerDuty</div>
          <div class="api-item">Grafana</div>
          <div class="api-item">MongoDB Atlas</div>
          <div class="api-item">Elasticsearch</div>
        </div>
      </div>

      <div class="tier">
        <div class="tier-header" onclick="toggleTier(this)">
          <h3>Tier 4 — Services <span class="count">14 APIs</span></h3>
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>
        </div>
        <div class="api-grid collapsed">
          <div class="api-item">OpenWeather</div>
          <div class="api-item">NewsAPI</div>
          <div class="api-item">CoinGecko</div>
          <div class="api-item">Alpha Vantage</div>
          <div class="api-item">Unsplash</div>
          <div class="api-item">Giphy</div>
          <div class="api-item">Mapbox</div>
          <div class="api-item">Google Maps</div>
          <div class="api-item">Calendly</div>
          <div class="api-item">Zoom</div>
          <div class="api-item">Intercom</div>
          <div class="api-item">Zendesk</div>
          <div class="api-item">Mailchimp</div>
          <div class="api-item">ConvertKit</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Quick start -->
<section id="quickstart" class="sep fade-in">
  <div class="container">
    <p class="section-label">Quick start</p>
    <h2>Up and running in 30 seconds</h2>
    <p class="section-desc">Add to your MCP config and go. Your AI gets full API access immediately.</p>

    <div class="tabs">
      <button class="tab active" data-tab="claude">Claude Code</button>
      <button class="tab" data-tab="cursor">Cursor</button>
      <button class="tab" data-tab="self-hosted">Self-hosted</button>
    </div>

    <div class="tab-content active" data-tab="claude">
      <pre><span class="comment">// ~/.claude/mcp.json</span>
{
  <span class="key">"servers"</span>: {
    <span class="key">"github"</span>: {
      <span class="key">"url"</span>: <span class="string">"https://cm.dee.ad/mcp?api_id=github"</span>,
      <span class="key">"headers"</span>: { <span class="key">"x-api-key"</span>: <span class="string">"your_github_token"</span> }
    }
  }
}</pre>
    </div>

    <div class="tab-content" data-tab="cursor">
      <pre><span class="comment">// Settings → MCP → Add server</span>

URL:  <span class="string">https://cm.dee.ad/mcp?api_id=github</span>

Header:  <span class="key">x-api-key</span>: <span class="string">your_github_token</span></pre>
    </div>

    <div class="tab-content" data-tab="self-hosted">
      <pre><span class="comment"># Install globally</span>
npm install -g universal-codemode-mcp

<span class="comment"># Run with any supported API</span>
universal-codemode-mcp serve --spec github</pre>
      <pre><span class="comment">// Add to Claude Code as a local server</span>
{
  <span class="key">"servers"</span>: {
    <span class="key">"github"</span>: {
      <span class="key">"command"</span>: <span class="string">"universal-codemode-mcp"</span>,
      <span class="key">"args"</span>: [<span class="string">"serve"</span>, <span class="string">"--spec"</span>, <span class="string">"github"</span>],
      <span class="key">"env"</span>: { <span class="key">"UCMCP_AUTH_VALUE"</span>: <span class="string">"your_github_token"</span> }
    }
  }
}</pre>
    </div>

    <p style="margin-top: 1.5rem; font-size: 0.875rem; color: var(--muted);">
      Your API keys never touch our servers. Credentials are injected into outbound calls and discarded immediately.
    </p>
  </div>
</section>

<!-- Architecture -->
<section id="architecture" class="sep fade-in">
  <div class="container">
    <p class="section-label">Architecture</p>
    <h2>How it fits together</h2>
    <p class="section-desc">A Cloudflare Worker sandboxes all code execution. Your credentials stay safe.</p>

    <div class="arch-svg-wrap">
      <svg viewBox="0 0 620 340" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- AI Agent box -->
        <rect x="190" y="8" width="240" height="44" rx="6" fill="white" stroke="#e5e5e5"/>
        <text x="310" y="35" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#111">AI Agent</text>
        <text x="310" y="35" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="400" fill="#999" dy="14">Claude · Cursor · Codex · OpenClaw</text>

        <!-- Arrow down -->
        <line x1="310" y1="52" x2="310" y2="82" stroke="#e5e5e5" stroke-width="1.5"/>
        <polygon points="305,78 310,86 315,78" fill="#ccc"/>
        <text x="322" y="72" font-family="JetBrains Mono, monospace" font-size="9" fill="#999">MCP</text>

        <!-- codemode server box -->
        <rect x="110" y="86" width="400" height="200" rx="8" fill="#fafafa" stroke="#e5e5e5"/>
        <text x="310" y="108" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="#111">codemode server</text>
        <text x="310" y="122" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="#999">Cloudflare Worker</text>

        <!-- search sandbox -->
        <rect x="134" y="140" width="165" height="68" rx="6" fill="white" stroke="#e5e5e5"/>
        <text x="216.5" y="161" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="500" fill="#111">search(code)</text>
        <text x="216.5" y="176" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="#999">Sandbox · No network</text>
        <text x="216.5" y="190" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="#999">Queries OpenAPI spec</text>

        <!-- execute sandbox -->
        <rect x="321" y="140" width="165" height="68" rx="6" fill="white" stroke="#e5e5e5"/>
        <text x="403.5" y="161" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="500" fill="#0066ff">execute(code)</text>
        <text x="403.5" y="176" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="#999">Sandbox · Restricted net</text>
        <text x="403.5" y="190" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="#999">Host allowlist + auth</text>

        <!-- Storage bar -->
        <rect x="134" y="226" width="352" height="36" rx="6" fill="white" stroke="#e5e5e5"/>
        <text x="310" y="249" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" fill="#999">Storage: R2 + KV  ·  Auto-refresh via cron</text>

        <!-- Arrow from execute to API -->
        <line x1="486" y1="174" x2="530" y2="174" stroke="#e5e5e5" stroke-width="1.5"/>
        <polygon points="526,170 534,174 526,178" fill="#ccc"/>

        <!-- API box -->
        <rect x="534" y="154" width="72" height="40" rx="6" fill="white" stroke="#0066ff" stroke-dasharray="4 3"/>
        <text x="570" y="179" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="500" fill="#0066ff">API</text>
      </svg>
    </div>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="container">
    <p>Built on <a href="https://blog.cloudflare.com/code-mode-mcp/" target="_blank">Cloudflare's Code Mode</a> pattern.</p>
    <p>Made by <a href="https://x.com/deeflectcom" target="_blank">Dee</a> · MIT License · <a href="https://github.com/deeflect/universal-codemode" target="_blank">GitHub</a></p>
  </div>
</footer>

<script>
// Tier toggle
function toggleTier(header) {
  header.classList.toggle('open');
  const grid = header.nextElementSibling;
  grid.classList.toggle('collapsed');
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const group = tab.parentElement;
    const parent = group.parentElement;
    group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    parent.querySelector(\`.tab-content[data-tab="\${tab.dataset.tab}"]\`).classList.add('active');
  });
});

// Fade in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
</script>

</body>
</html>
`;
