#!/usr/bin/env node

const server = process.env.UCMCP_BASE_URL || "http://127.0.0.1:8787";
const adminToken = process.env.ADMIN_TOKEN || "replace-me";

async function call(path, init = {}) {
  const r = await fetch(`${server}${path}`, init);
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} -> ${r.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

const payload = {
  apiId: "github-smoke",
  sourceUrl: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json",
  baseUrl: "https://api.github.com",
  allowedHosts: ["api.github.com"]
};

console.log("Registering github-smoke...");
await call("/register", {
  method: "POST",
  headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
  body: JSON.stringify(payload)
});

const apis = await call("/apis");
const found = apis.apis?.find((a) => a.apiId === "github-smoke");
if (!found) throw new Error("github-smoke missing from /apis response");

console.log(`OK: registered ${found.apiId} (${found.endpointCount ?? "?"} endpoints)`);
