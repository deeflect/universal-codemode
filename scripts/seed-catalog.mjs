#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.UCMCP_BASE_URL || "http://127.0.0.1:8787";
const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken) throw new Error("Missing ADMIN_TOKEN env var");

const dir = path.join(process.cwd(), "catalog");
const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const payload = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
  const r = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${adminToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await r.text();
  console.log(`${file}: ${r.status} ${body.slice(0, 200)}`);
}
