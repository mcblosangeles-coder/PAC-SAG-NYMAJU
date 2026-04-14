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
process.env.METRICS_TOKEN = process.env.METRICS_TOKEN ?? "metrics_test_token";

type MetricsResponse = {
  counters: Record<string, number>;
  metrics: Partial<Record<string, { value: number; isWithinThreshold: boolean }>>;
  summary: {
    isHealthy: boolean;
    failingMetrics: string[];
  };
};

type MetricsHistoryResponse = {
  window: "24h" | "7d";
  points: Array<{
    at: string;
    errorRate: number;
    p95Latency: number;
    count5xx: number;
  }>;
  summary: {
    samples: number;
    errorRate: number;
    p95Latency: number;
    count5xx: number;
  };
};

type OperationalAlertsStatusResponse = {
  enabled: boolean;
  rules: Array<{
    id: string;
    metric: string;
    severity: string;
    state: {
      isActive: boolean;
      isSilenced?: boolean;
    };
  }>;
};

type PaginatedResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  items: Array<Record<string, unknown>>;
};

describe("Internal metrics endpoint", async () => {
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

  it("returns 403 when metrics token is missing", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/metrics`);
    assert.equal(response.status, 403);
  });

  it("returns metrics snapshot with valid token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/metrics`, {
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/i);

    const body = (await response.json()) as MetricsResponse;
    assert.equal(typeof body.counters.requestsTotal, "number");
    const metricKeys = [
      "error_rate",
      "p95_latency",
      "5xx_count",
      "auth_refresh_failed_rate",
      "audit_log_failed_count",
      "workflow_422_rate"
    ] as const;

    for (const key of metricKeys) {
      assert.ok(body.metrics[key], `Metric key missing: ${key}`);
      assert.equal(typeof body.metrics[key]?.value, "number");
    }
    assert.equal(typeof body.summary.isHealthy, "boolean");
    assert.equal(Array.isArray(body.summary.failingMetrics), true);
  });

  it("returns 403 in history endpoint when metrics token is missing", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/metrics/history?window=24h`);
    assert.equal(response.status, 403);
  });

  it("returns 400 in history endpoint when window is invalid", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/metrics/history?window=48h`, {
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });
    assert.equal(response.status, 400);
  });

  it("returns 200 in history endpoint for 24h window", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/metrics/history?window=24h`, {
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as MetricsHistoryResponse;
    assert.equal(body.window, "24h");
    assert.equal(Array.isArray(body.points), true);
    assert.equal(typeof body.summary.errorRate, "number");
    assert.equal(typeof body.summary.p95Latency, "number");
    assert.equal(typeof body.summary.count5xx, "number");
  });

  it("returns 403 in operational alerts status when metrics token is missing", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/alerts/operational`);
    assert.equal(response.status, 403);
  });

  it("returns 200 in operational alerts status with valid token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/alerts/operational`, {
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as OperationalAlertsStatusResponse;
    assert.equal(Array.isArray(body.rules), true);
    assert.equal(typeof body.enabled, "boolean");
  });

  it("executes manual operational alerts evaluation", async () => {
    const response = await fetch(`${baseUrl}/api/v1/internal/alerts/operational/evaluate`, {
      method: "POST",
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as OperationalAlertsStatusResponse;
    assert.equal(Array.isArray(body.rules), true);
  });

  it("returns 400 when acknowledge comment is missing", async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/error_rate_24h/acknowledge`,
      {
        method: "POST",
        headers: {
          "x-metrics-token": process.env.METRICS_TOKEN as string,
          "content-type": "application/json"
        },
        body: JSON.stringify({ comment: "" })
      }
    );
    assert.equal(response.status, 400);
  });

  it("executes acknowledge + silence + unsilence and exposes history", async () => {
    const headers = {
      "x-metrics-token": process.env.METRICS_TOKEN as string,
      "content-type": "application/json"
    };
    const silencedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const ackResponse = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/error_rate_24h/acknowledge`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ comment: "ack de prueba", operator: "test-suite" })
      }
    );
    assert.equal(ackResponse.status, 200);

    const silenceResponse = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/error_rate_24h/silence`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          reason: "silencio controlado de prueba",
          silencedUntil,
          operator: "test-suite"
        })
      }
    );
    assert.equal(silenceResponse.status, 200);

    const statusResponse = await fetch(`${baseUrl}/api/v1/internal/alerts/operational`, {
      headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
    });
    assert.equal(statusResponse.status, 200);
    const statusBody = (await statusResponse.json()) as OperationalAlertsStatusResponse;
    const targetRule = statusBody.rules.find((rule) => rule.id === "error_rate_24h");
    assert.equal(targetRule?.state.isSilenced, true);

    const unsilenceResponse = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/error_rate_24h/unsilence`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "fin prueba", operator: "test-suite" })
      }
    );
    assert.equal(unsilenceResponse.status, 200);

    const actionsResponse = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/actions?ruleId=error_rate_24h&page=1&pageSize=20`,
      {
        headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
      }
    );
    assert.equal(actionsResponse.status, 200);
    const actionsBody = (await actionsResponse.json()) as PaginatedResponse;
    assert.equal(actionsBody.page, 1);
    assert.equal(Array.isArray(actionsBody.items), true);
    assert.equal(actionsBody.items.length > 0, true);

    const eventsResponse = await fetch(
      `${baseUrl}/api/v1/internal/alerts/operational/events?ruleId=error_rate_24h&page=1&pageSize=20`,
      {
        headers: { "x-metrics-token": process.env.METRICS_TOKEN as string }
      }
    );
    assert.equal(eventsResponse.status, 200);
    const eventsBody = (await eventsResponse.json()) as PaginatedResponse;
    assert.equal(Array.isArray(eventsBody.items), true);
    assert.equal(eventsBody.items.length > 0, true);
  });
});
