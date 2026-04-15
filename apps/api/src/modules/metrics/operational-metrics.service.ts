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
  trafficProfile: TrafficProfile;
};

export type TrafficProfile = "operational" | "validation";
export type MetricsProfile = "all" | TrafficProfile;

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
  all: {
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
  },
  operational: {
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
  },
  validation: {
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
  }
};

const rate = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return round(numerator / denominator);
};

const pushDuration = (
  target: {
    durationSamplesMs: number[];
  },
  durationMs: number
): void => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return;
  target.durationSamplesMs.push(durationMs);
  if (target.durationSamplesMs.length > MAX_DURATION_SAMPLES) {
    target.durationSamplesMs.shift();
  }
};

const updateStateForRequest = (
  target: typeof state.all,
  input: Omit<HttpRequestMetricInput, "trafficProfile">
): void => {
  const pathname = toPathname(input.path);

  target.requestsTotal += 1;
  if (input.statusCode >= 400) target.requestsErrorTotal += 1;
  if (input.statusCode >= 500) target.requests5xxTotal += 1;

  if (REFRESH_PATH_REGEX.test(pathname)) {
    target.authRefreshAttempts += 1;
    if (input.statusCode >= 400) {
      target.authRefreshFailures += 1;
    }
  }

  if (CHANGE_STATE_PATH_REGEX.test(pathname)) {
    target.workflowChangeStateAttempts += 1;
    if (input.statusCode === 422) {
      target.workflowChangeState422 += 1;
    }
  }

  pushDuration(target, input.durationMs);
};

export const operationalMetricsService = {
  recordHttpRequest(input: HttpRequestMetricInput): void {
    updateStateForRequest(state.all, input);
    updateStateForRequest(state[input.trafficProfile], input);
  },

  recordAuditLogFailure(): void {
    state.all.auditLogFailedCount += 1;
    state.operational.auditLogFailedCount += 1;
    state.validation.auditLogFailedCount += 1;
  },

  snapshot(profile: MetricsProfile = "all"): OperationalMetricsSnapshot {
    const target = state[profile];
    const values = {
      error_rate: rate(target.requestsErrorTotal, target.requestsTotal),
      p95_latency: calculateP95(target.durationSamplesMs),
      "5xx_count": target.requests5xxTotal,
      auth_refresh_failed_rate: rate(target.authRefreshFailures, target.authRefreshAttempts),
      audit_log_failed_count: target.auditLogFailedCount,
      workflow_422_rate: rate(target.workflowChangeState422, target.workflowChangeStateAttempts)
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
      startedAt: target.startedAt,
      now: new Date().toISOString(),
      counters: {
        requestsTotal: target.requestsTotal,
        requestsErrorTotal: target.requestsErrorTotal,
        requests5xxTotal: target.requests5xxTotal,
        authRefreshAttempts: target.authRefreshAttempts,
        authRefreshFailures: target.authRefreshFailures,
        workflowChangeStateAttempts: target.workflowChangeStateAttempts,
        workflowChangeState422: target.workflowChangeState422,
        auditLogFailedCount: target.auditLogFailedCount,
        durationSampleCount: target.durationSamplesMs.length
      },
      metrics: statusByMetric,
      summary: {
        isHealthy: failingMetrics.length === 0,
        failingMetrics
      }
    };
  }
};
