import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

type SamplingRule = {
  pattern: RegExp;
  rate: number;
};

type LoggerPolicy = {
  minLevel: LogLevel;
  enableHttpRequestStarted: boolean;
  excludePathPatterns: RegExp[];
  defaultHttpSampleRate: number;
  httpPathSamplingRules: SamplingRule[];
};

const serviceName = "@pac/api";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const SENSITIVE_KEYWORDS = [
  "password",
  "authorization",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "cookie",
  "set-cookie",
  "secret",
  "api_key",
  "apikey",
  "private_key",
  "privatekey"
];

const normalizeKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isSensitiveKey = (key: string): boolean => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYWORDS.some((keyword) => normalized.includes(normalizeKey(keyword)));
};

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        result[key] = "[REDACTED]";
        continue;
      }
      result[key] = sanitizeValue(nestedValue, depth + 1);
    }
    return result;
  }
  return value;
};

const parseBoolean = (rawValue: string | undefined, fallback: boolean): boolean => {
  if (!rawValue) return fallback;
  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const parseRate = (rawValue: string | undefined, fallback: number): number => {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return 0;
  if (parsed >= 1) return 1;
  return parsed;
};

const parseLevel = (rawValue: string | undefined, fallback: LogLevel): LogLevel => {
  if (!rawValue) return fallback;
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "debug" || normalized === "info" || normalized === "warn" || normalized === "error") {
    return normalized;
  }
  return fallback;
};

const wildcardPatternToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
};

const parsePathList = (rawValue: string | undefined, fallback: string[]): RegExp[] => {
  const source = rawValue
    ? rawValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : fallback;

  return source.map(wildcardPatternToRegex);
};

const parseSamplingRules = (rawValue: string | undefined): SamplingRule[] => {
  if (!rawValue) return [];
  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .flatMap((entry) => {
      const [pattern, rateRaw] = entry.split("=");
      if (!pattern || !rateRaw) return [];
      return [{ pattern: wildcardPatternToRegex(pattern.trim()), rate: parseRate(rateRaw.trim(), 1) }];
    });
};

const defaultPolicyByEnv = (): LoggerPolicy => {
  if (env.nodeEnv === "test") {
    return {
      minLevel: "warn",
      enableHttpRequestStarted: false,
      excludePathPatterns: [wildcardPatternToRegex("/api/v1/health")],
      defaultHttpSampleRate: 1,
      httpPathSamplingRules: [ { pattern: wildcardPatternToRegex("/api/v1/health"), rate: 0 } ]
    };
  }

  if (env.nodeEnv === "production") {
    return {
      minLevel: "info",
      enableHttpRequestStarted: false,
      excludePathPatterns: [wildcardPatternToRegex("/api/v1/health")],
      defaultHttpSampleRate: 1,
      httpPathSamplingRules: [ { pattern: wildcardPatternToRegex("/api/v1/health"), rate: 0 } ]
    };
  }

  return {
    minLevel: "info",
    enableHttpRequestStarted: true,
    excludePathPatterns: [wildcardPatternToRegex("/api/v1/health")],
    defaultHttpSampleRate: 1,
    httpPathSamplingRules: []
  };
};

const policy = (() => {
  const defaults = defaultPolicyByEnv();
  return {
    minLevel: parseLevel(process.env.LOG_LEVEL_MIN, defaults.minLevel),
    enableHttpRequestStarted: parseBoolean(
      process.env.LOG_HTTP_REQUEST_STARTED,
      defaults.enableHttpRequestStarted
    ),
    excludePathPatterns: parsePathList(process.env.LOG_EXCLUDE_PATH_PATTERNS, ["/api/v1/health"]),
    defaultHttpSampleRate: parseRate(process.env.LOG_HTTP_SAMPLE_RATE, defaults.defaultHttpSampleRate),
    httpPathSamplingRules: parseSamplingRules(process.env.LOG_HTTP_PATH_SAMPLE_RULES)
  };
})();

const shouldEmitByLevel = (level: LogLevel): boolean =>
  LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[policy.minLevel];

const resolveSampleRateForPath = (path: string | null): number => {
  if (!path) return policy.defaultHttpSampleRate;
  const matchedRule = policy.httpPathSamplingRules.find((rule) => rule.pattern.test(path));
  return matchedRule ? matchedRule.rate : policy.defaultHttpSampleRate;
};

const toStableUnitInterval = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ((hash >>> 0) % 10000) / 10000;
};

const shouldSkipByVolumePolicy = (event: string, context: LogContext): boolean => {
  if (event === "http.request.failed") return false;

  const isHttpRequestEvent = event === "http.request.started" || event === "http.request.completed";
  if (!isHttpRequestEvent) return false;

  if (event === "http.request.started" && !policy.enableHttpRequestStarted) {
    return true;
  }

  const path = typeof context.path === "string" ? context.path : null;
  if (path && policy.excludePathPatterns.some((pattern) => pattern.test(path))) {
    return true;
  }

  const sampleRate = resolveSampleRateForPath(path);
  if (sampleRate >= 1) return false;
  if (sampleRate <= 0) return true;

  const requestId = typeof context.requestId === "string" ? context.requestId : "";
  const sampleKey = `${event}|${path ?? "no-path"}|${requestId}`;
  return toStableUnitInterval(sampleKey) > sampleRate;
};

const write = (
  level: LogLevel,
  event: string,
  message: string,
  context: LogContext = {}
): void => {
  if (!shouldEmitByLevel(level)) return;
  if (shouldSkipByVolumePolicy(event, context)) return;

  const sanitizedContext = sanitizeValue(context) as LogContext;
  const requestId =
    typeof sanitizedContext.requestId === "string" && sanitizedContext.requestId.trim().length > 0
      ? sanitizedContext.requestId
      : undefined;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: serviceName,
    environment: env.nodeEnv,
    event,
    message,
    ...(requestId ? { requestId } : {}),
    context: sanitizedContext
  };

  const serialized = JSON.stringify(payload);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
};

const toErrorContext = (error: unknown): LogContext => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack ?? null
    };
  }
  return { errorMessage: String(error) };
};

export const logger = {
  debug(event: string, message: string, context: LogContext = {}): void {
    write("debug", event, message, context);
  },
  info(event: string, message: string, context: LogContext = {}): void {
    write("info", event, message, context);
  },
  warn(event: string, message: string, context: LogContext = {}): void {
    write("warn", event, message, context);
  },
  error(event: string, message: string, error?: unknown, context: LogContext = {}): void {
    write("error", event, message, { ...context, ...(error ? toErrorContext(error) : {}) });
  }
};
