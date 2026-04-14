type ThresholdKey =
  | "error_rate"
  | "p95_latency"
  | "5xx_count"
  | "auth_refresh_failed_rate"
  | "audit_log_failed_count"
  | "workflow_422_rate";

type ThresholdDefinition = {
  comparator: "lte" | "lt";
  max: number;
  unit: "ratio" | "ms" | "count";
};

type HttpRequestMetricInput = {
  path: string;
  statusCode: number;
  durationMs: number;
};

export type OperationalMetricCounters = {
  requestsTotal: number;
  requestsErrorTotal: number;
  requests5xxTotal: number;
  authRefreshAttempts: number;
  authRefreshFailures: number;
  workflowChangeStateAttempts: number;
  workflowChangeState422: number;
  auditLogFailedCount: number;
  durationSampleCount: number;
};

export type OperationalMetricStatus = {
  value: number;
  unit: "ratio" | "ms" | "count";
  comparator: "lte" | "lt";
  threshold: number;
  isWithinThreshold: boolean;
};

export type OperationalMetricsSnapshot = {
  startedAt: string;
  now: string;
  counters: OperationalMetricCounters;
  metrics: Record<ThresholdKey, OperationalMetricStatus>;
  summary: {
    isHealthy: boolean;
    failingMetrics: ThresholdKey[];
  };
};

const MAX_DURATION_SAMPLES = 2000;
const REFRESH_PATH_REGEX = /^\/api\/v1\/auth\/refresh$/i;
const CHANGE_STATE_PATH_REGEX = /^\/api\/v1\/expedientes\/[^/]+\/change-state$/i;

export const METRIC_THRESHOLDS: Record<ThresholdKey, ThresholdDefinition> = {
  error_rate: { comparator: "lte", max: 0.05, unit: "ratio" },
  p95_latency: { comparator: "lte", max: 700, unit: "ms" },
  "5xx_count": { comparator: "lt", max: 5, unit: "count" },
  auth_refresh_failed_rate: { comparator: "lte", max: 0.2, unit: "ratio" },
  audit_log_failed_count: { comparator: "lt", max: 1, unit: "count" },
  workflow_422_rate: { comparator: "lte", max: 0.25, unit: "ratio" }
};

const round = (value: number, decimals = 4): number => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(decimals));
};

const toPathname = (path: string): string => {
  const [pathname] = path.split("?");
  return pathname || path;
};

const calculateP95 = (samples: number[]): number => {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return round(sorted[index] ?? 0, 2);
};

const evaluateThreshold = (value: number, threshold: ThresholdDefinition): boolean => {
  if (threshold.comparator === "lt") return value < threshold.max;
  return value <= threshold.max;
};

const state = {
  startedAt: new Date().toISOString(),
  requestsTotal: 0,
  requestsErrorTotal: 0,
  requests5xxTotal: 0,
  authRefreshAttempts: 0,
  authRefreshFailures: 0,
  workflowChangeStateAttempts: 0,
  workflowChangeState422: 0,
  auditLogFailedCount: 0,
  durationSamplesMs: [] as number[]
};

const rate = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return round(numerator / denominator);
};

const pushDuration = (durationMs: number): void => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  state.durationSamplesMs.push(durationMs);
  if (state.durationSamplesMs.length > MAX_DURATION_SAMPLES) {
    state.durationSamplesMs.shift();
  }
};

export const operationalMetricsService = {
  recordHttpRequest(input: HttpRequestMetricInput): void {
    const pathname = toPathname(input.path);

    state.requestsTotal += 1;
    if (input.statusCode >= 400) state.requestsErrorTotal += 1;
    if (input.statusCode >= 500) state.requests5xxTotal += 1;

    if (REFRESH_PATH_REGEX.test(pathname)) {
      state.authRefreshAttempts += 1;
      if (input.statusCode >= 400) {
        state.authRefreshFailures += 1;
      }
    }

    if (CHANGE_STATE_PATH_REGEX.test(pathname)) {
      state.workflowChangeStateAttempts += 1;
      if (input.statusCode === 422) {
        state.workflowChangeState422 += 1;
      }
    }

    pushDuration(input.durationMs);
  },

  recordAuditLogFailure(): void {
    state.auditLogFailedCount += 1;
  },

  snapshot(): OperationalMetricsSnapshot {
    const values = {
      error_rate: rate(state.requestsErrorTotal, state.requestsTotal),
      p95_latency: calculateP95(state.durationSamplesMs),
      "5xx_count": state.requests5xxTotal,
      auth_refresh_failed_rate: rate(state.authRefreshFailures, state.authRefreshAttempts),
      audit_log_failed_count: state.auditLogFailedCount,
      workflow_422_rate: rate(state.workflowChangeState422, state.workflowChangeStateAttempts)
    };

    const statusByMetric = Object.fromEntries(
      (Object.keys(values) as ThresholdKey[]).map((metric) => {
        const threshold = METRIC_THRESHOLDS[metric];
        const value = values[metric];
        return [
          metric,
          {
            value,
            unit: threshold.unit,
            comparator: threshold.comparator,
            threshold: threshold.max,
            isWithinThreshold: evaluateThreshold(value, threshold)
          }
        ];
      })
    ) as Record<ThresholdKey, OperationalMetricStatus>;

    const failingMetrics = (Object.entries(statusByMetric) as Array<
      [ThresholdKey, { isWithinThreshold: boolean }]
    >)
      .filter(([, status]) => !status.isWithinThreshold)
      .map(([metric]) => metric);

    return {
      startedAt: state.startedAt,
      now: new Date().toISOString(),
      counters: {
        requestsTotal: state.requestsTotal,
        requestsErrorTotal: state.requestsErrorTotal,
        requests5xxTotal: state.requests5xxTotal,
        authRefreshAttempts: state.authRefreshAttempts,
        authRefreshFailures: state.authRefreshFailures,
        workflowChangeStateAttempts: state.workflowChangeStateAttempts,
        workflowChangeState422: state.workflowChangeState422,
        auditLogFailedCount: state.auditLogFailedCount,
        durationSampleCount: state.durationSamplesMs.length
      },
      metrics: statusByMetric,
      summary: {
        isHealthy: failingMetrics.length === 0,
        failingMetrics
      }
    };
  }
};
