import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import {
  operationalMetricsService,
  type MetricsProfile,
  type OperationalMetricCounters,
  type OperationalMetricsSnapshot
} from "./operational-metrics.service";

type HistoryWindow = "24h" | "7d";

type DeltaCounters = Omit<OperationalMetricCounters, "durationSampleCount">;

type HistoricalMetricPoint = {
  at: string;
  errorRate: number;
  p95Latency: number;
  count5xx: number;
};

const SOURCE_BY_PROFILE: Record<MetricsProfile, string> = {
  all: "api_internal_all",
  operational: "api_internal_operational",
  validation: "api_internal_validation"
};
const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const round = (value: number, decimals = 4): number => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
};

const percentil95 = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return round(sorted[index] ?? 0, 2);
};

const truncateToMinute = (date: Date): Date =>
  new Date(Math.floor(date.getTime() / MS_PER_MINUTE) * MS_PER_MINUTE);

const toDelta = (current: number, previous: number | undefined): number => {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(previous ?? NaN)) return Math.max(0, current);
  if (current >= (previous ?? 0)) return current - (previous ?? 0);
  return Math.max(0, current);
};

const ratio = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return round(numerator / denominator);
};

const getWindowStart = (window: HistoryWindow): Date => {
  const now = Date.now();
  const distance = window === "24h" ? MS_PER_DAY : 7 * MS_PER_DAY;
  return new Date(now - distance);
};

const toDeltaCounters = (
  snapshot: OperationalMetricsSnapshot,
  lastPersisted: DeltaCounters | null
): DeltaCounters => ({
  requestsTotal: toDelta(snapshot.counters.requestsTotal, lastPersisted?.requestsTotal),
  requestsErrorTotal: toDelta(snapshot.counters.requestsErrorTotal, lastPersisted?.requestsErrorTotal),
  requests5xxTotal: toDelta(snapshot.counters.requests5xxTotal, lastPersisted?.requests5xxTotal),
  authRefreshAttempts: toDelta(
    snapshot.counters.authRefreshAttempts,
    lastPersisted?.authRefreshAttempts
  ),
  authRefreshFailures: toDelta(
    snapshot.counters.authRefreshFailures,
    lastPersisted?.authRefreshFailures
  ),
  workflowChangeStateAttempts: toDelta(
    snapshot.counters.workflowChangeStateAttempts,
    lastPersisted?.workflowChangeStateAttempts
  ),
  workflowChangeState422: toDelta(
    snapshot.counters.workflowChangeState422,
    lastPersisted?.workflowChangeState422
  ),
  auditLogFailedCount: toDelta(
    snapshot.counters.auditLogFailedCount,
    lastPersisted?.auditLogFailedCount
  )
});

const lastPersistedCountersByProfile: Record<MetricsProfile, DeltaCounters | null> = {
  all: null,
  operational: null,
  validation: null
};
let collectorInterval: NodeJS.Timeout | null = null;

const persistSnapshot = async (
  profile: MetricsProfile,
  snapshot: OperationalMetricsSnapshot
): Promise<void> => {
  const source = SOURCE_BY_PROFILE[profile];
  const now = new Date();
  const windowEnd = truncateToMinute(now);
  const windowStart = new Date(windowEnd.getTime() - env.metricsCollectorIntervalSeconds * MS_PER_SECOND);
  const deltaCounters = toDeltaCounters(snapshot, lastPersistedCountersByProfile[profile]);

  const errorRate = ratio(deltaCounters.requestsErrorTotal, deltaCounters.requestsTotal);
  const authRefreshFailedRate = ratio(
    deltaCounters.authRefreshFailures,
    deltaCounters.authRefreshAttempts
  );
  const workflow422Rate = ratio(
    deltaCounters.workflowChangeState422,
    deltaCounters.workflowChangeStateAttempts
  );

  await prisma.operationalMetricSnapshot.upsert({
    where: {
      source_windowStart: {
        source,
        windowStart
      }
    },
    update: {
      windowEnd,
      requestsTotal: deltaCounters.requestsTotal,
      requestsErrorTotal: deltaCounters.requestsErrorTotal,
      requests5xxTotal: deltaCounters.requests5xxTotal,
      authRefreshAttempts: deltaCounters.authRefreshAttempts,
      authRefreshFailures: deltaCounters.authRefreshFailures,
      workflowChangeAttempts: deltaCounters.workflowChangeStateAttempts,
      workflow422Total: deltaCounters.workflowChangeState422,
      auditLogFailedCount: deltaCounters.auditLogFailedCount,
      p95LatencyMs: snapshot.metrics.p95_latency.value,
      errorRate,
      authRefreshFailedRate,
      workflow422Rate
    },
    create: {
      source,
      windowStart,
      windowEnd,
      requestsTotal: deltaCounters.requestsTotal,
      requestsErrorTotal: deltaCounters.requestsErrorTotal,
      requests5xxTotal: deltaCounters.requests5xxTotal,
      authRefreshAttempts: deltaCounters.authRefreshAttempts,
      authRefreshFailures: deltaCounters.authRefreshFailures,
      workflowChangeAttempts: deltaCounters.workflowChangeStateAttempts,
      workflow422Total: deltaCounters.workflowChangeState422,
      auditLogFailedCount: deltaCounters.auditLogFailedCount,
      p95LatencyMs: snapshot.metrics.p95_latency.value,
      errorRate,
      authRefreshFailedRate,
      workflow422Rate
    }
  });

  const retentionCutoff = new Date(Date.now() - env.metricsRetentionDays * MS_PER_DAY);
  await prisma.operationalMetricSnapshot.deleteMany({
    where: {
      source,
      windowEnd: {
        lt: retentionCutoff
      }
    }
  });

  lastPersistedCountersByProfile[profile] = {
    requestsTotal: snapshot.counters.requestsTotal,
    requestsErrorTotal: snapshot.counters.requestsErrorTotal,
    requests5xxTotal: snapshot.counters.requests5xxTotal,
    authRefreshAttempts: snapshot.counters.authRefreshAttempts,
    authRefreshFailures: snapshot.counters.authRefreshFailures,
    workflowChangeStateAttempts: snapshot.counters.workflowChangeStateAttempts,
    workflowChangeState422: snapshot.counters.workflowChangeState422,
    auditLogFailedCount: snapshot.counters.auditLogFailedCount
  };
};

const collectOnce = async (): Promise<void> => {
  const snapshots: Array<[MetricsProfile, OperationalMetricsSnapshot]> = [
    ["all", operationalMetricsService.snapshot("all")],
    ["operational", operationalMetricsService.snapshot("operational")],
    ["validation", operationalMetricsService.snapshot("validation")]
  ];

  for (const [profile, snapshot] of snapshots) {
    await persistSnapshot(profile, snapshot);
  }
};

export const metricsHistoryService = {
  startCollector(): void {
    if (!env.metricsCollectorEnabled) {
      logger.info("jobs.metrics_collector.disabled", "Metrics collector disabled by environment.", {
        intervalSeconds: env.metricsCollectorIntervalSeconds,
        retentionDays: env.metricsRetentionDays
      });
      return;
    }

    if (collectorInterval) return;

    void collectOnce().catch((error) => {
      logger.error(
        "jobs.metrics_collector.failed",
        "Failed to persist initial metrics snapshot.",
        error
      );
    });

    collectorInterval = setInterval(() => {
      void collectOnce().catch((error) => {
        logger.error("jobs.metrics_collector.failed", "Failed to persist metrics snapshot.", error);
      });
    }, env.metricsCollectorIntervalSeconds * MS_PER_SECOND);

    logger.info("jobs.metrics_collector.started", "Metrics collector started.", {
      intervalSeconds: env.metricsCollectorIntervalSeconds,
      retentionDays: env.metricsRetentionDays
    });
  },

  stopCollector(): void {
    if (!collectorInterval) return;
    clearInterval(collectorInterval);
    collectorInterval = null;
    logger.info("jobs.metrics_collector.stopped", "Metrics collector stopped.");
  },

  async getHistoricalMetrics(window: HistoryWindow, profile: MetricsProfile = "operational") {
    const since = getWindowStart(window);
    const source = SOURCE_BY_PROFILE[profile];
    const rows = await prisma.operationalMetricSnapshot.findMany({
      where: {
        source,
        windowStart: {
          gte: since
        }
      },
      orderBy: {
        windowStart: "asc"
      }
    });

    const points: HistoricalMetricPoint[] = rows.map((row) => ({
      at: row.windowStart.toISOString(),
      errorRate: Number(row.errorRate),
      p95Latency: Number(row.p95LatencyMs),
      count5xx: row.requests5xxTotal
    }));

    const totalRequests = rows.reduce((acc, row) => acc + row.requestsTotal, 0);
    const totalErrors = rows.reduce((acc, row) => acc + row.requestsErrorTotal, 0);
    const total5xx = rows.reduce((acc, row) => acc + row.requests5xxTotal, 0);
    const p95Series = rows.map((row) => Number(row.p95LatencyMs));

    return {
      window,
      profile,
      since: since.toISOString(),
      now: new Date().toISOString(),
      points,
      summary: {
        samples: rows.length,
        errorRate: ratio(totalErrors, totalRequests),
        p95Latency: percentil95(p95Series),
        count5xx: total5xx
      }
    };
  }
};
