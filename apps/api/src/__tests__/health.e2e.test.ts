import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.NODE_ENV = "test";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://pac_user:pac_password@localhost:5432/pac_nymaju_spr?schema=public";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret";

type HealthResponse = {
  service: string;
  status: string;
  timestamp: string;
  code?: string;
};

describe("Health endpoint contract", async () => {
  const { createApp } = await import("../app");
  const app = createApp();

  let server: http.Server;
  let baseUrl = "";

  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.on("listening", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to start test server.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it("returns 200 with expected payload contract", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/i);

    const body = (await response.json()) as HealthResponse;
    assert.equal(body.service, "api");
    assert.equal(body.status, "ok");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
    assert.equal(body.code, undefined);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
    assert.match(
      response.headers.get("content-security-policy") ?? "",
      /default-src 'none'; frame-ancestors 'none'; base-uri 'none'/i
    );
  });
});
