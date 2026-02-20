#!/usr/bin/env node
const [,, endpoint, adminToken, jsonPath] = process.argv;
if (!endpoint || !adminToken || !jsonPath) {
  console.error("Usage: node scripts/register.mjs <endpoint> <adminToken> <payload.json>");
  process.exit(1);
}
const fs = await import('node:fs/promises');
const payload = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
const res = await fetch(`${endpoint.replace(/\/$/, '')}/register`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${adminToken}`
  },
  body: JSON.stringify(payload)
});
console.log(res.status, await res.text());
