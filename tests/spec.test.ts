import { describe, it, expect } from "vitest";
import { ingestSpec } from "../src/spec";

describe("spec ingestion", () => {
  it("normalizes operation map and resolves local refs", async () => {
    const spec = {
      openapi: "3.0.0",
      info: { title: "Demo", version: "1" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/users/{id}": {
          get: {
            operationId: "getUser",
            parameters: [{ $ref: "#/components/parameters/UserId" }],
            responses: { "200": { description: "ok" } }
          }
        }
      },
      components: {
        parameters: {
          UserId: { name: "id", in: "path", required: true, schema: { type: "string" } }
        }
      }
    };

    const { processed } = await ingestSpec({ apiId: "demo", spec });
    expect(processed.operationMap.getUser.path).toBe("/users/{id}");
    const param = processed.paths["/users/{id}"]?.get?.parameters?.[0] as { name: string };
    expect(param.name).toBe("id");
  });

  it("accepts explicit baseUrl override", async () => {
    const spec = { openapi: "3.0.0", info: { title: "X", version: "1" }, paths: {} };
    const { processed } = await ingestSpec({ apiId: "xx", spec, baseUrl: "https://api.x.test" });
    expect(processed.baseUrl).toContain("https://api.x.test");
  });
});
