import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import http from "node:http";

process.env.NODE_ENV = "test";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://pac_user:pac_password@localhost:5432/pac_nymaju_spr?schema=public";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret";

describe("Rate limit middleware", () => {
  let server: http.Server;
  let baseUrl = "";
  let originalRateLimitEnabled = false;
  let envModule: { env: { rateLimitEnabled: boolean } };

  before(async () => {
    envModule = await import("../lib/env");
    const { createRateLimitMiddleware } = await import("../middlewares/rate-limit");
    originalRateLimitEnabled = envModule.env.rateLimitEnabled;
    envModule.env.rateLimitEnabled = true;
    const app = express();
    app.use(
      "/limited",
      createRateLimitMiddleware({
        id: "test.rate.limit",
        windowSeconds: 60,
        maxRequests: 1,
        keyResolver: () => "test-key"
      })
    );
    app.get("/limited", (_req, res) => {
      res.status(200).json({ ok: true });
    });

    server = app.listen(0);
    await new Promise<void>((resolve) => server.on("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to start rate limit test server.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    envModule.env.rateLimitEnabled = originalRateLimitEnabled;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it("returns 429 once max requests are exceeded", async () => {
    const first = await fetch(`${baseUrl}/limited`);
    assert.equal(first.status, 200);

    const second = await fetch(`${baseUrl}/limited`);
    assert.equal(second.status, 429);
    assert.equal(second.headers.get("retry-after"), "60");

    const secondBody = (await second.json()) as { code: string };
    assert.equal(secondBody.code, "RATE_LIMITED");
  });
});
