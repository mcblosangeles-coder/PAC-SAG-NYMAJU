type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  trustProxy: boolean;
  trustedProxyCidrs: string[];
  apiPrefix: string;
  corsAllowedOrigins: string[];
  metricsToken: string | null;
  metricsCollectorEnabled: boolean;
  metricsCollectorIntervalSeconds: number;
  metricsRetentionDays: number;
  alertsEvaluatorEnabled: boolean;
  alertsEvaluatorIntervalSeconds: number;
  alertsNotificationCooldownSeconds: number;
  alertsNotifyChannels: Array<"log" | "audit">;
  rateLimitEnabled: boolean;
  rateLimitStore: "memory" | "redis";
  rateLimitRequireRedis: boolean;
  rateLimitWindowSeconds: number;
  rateLimitAuthLoginMax: number;
  rateLimitAuthRefreshMax: number;
  rateLimitInternalMax: number;
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
};

const required = (name: string, value: string | undefined): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
};

const toNodeEnv = (value: string | undefined): AppEnv["nodeEnv"] => {
  if (!value || value.trim().length === 0) return "development";
  const normalized = value.trim().toLowerCase();
  if (normalized === "development" || normalized === "test" || normalized === "production") {
    return normalized;
  }
  throw new Error(`Invalid NODE_ENV value: ${value}`);
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value || value.trim().length === 0) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const toNumber = (name: string, value: string | undefined, fallback: number): number => {
  if (!value || value.trim().length === 0) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric environment variable: ${name}=${value}`);
  }
  return parsed;
};

const toPort = (value: string | undefined, fallback: number): number => {
  const parsed = toNumber("PORT", value, fallback);
  if (parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${parsed}`);
  }
  return parsed;
};

const validateUrl = (name: string, value: string): string => {
  try {
    const url = new URL(value);
    if (!url.protocol) throw new Error("missing protocol");
    return value;
  } catch {
    throw new Error(`Invalid URL environment variable: ${name}=${value}`);
  }
};

const parseCsv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const toNotifyChannels = (rawValue: string | undefined): Array<"log" | "audit"> => {
  if (!rawValue || rawValue.trim().length === 0) return ["log", "audit"];
  const channels = rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "log" | "audit" => item === "log" || item === "audit");
  return channels.length > 0 ? channels : ["log", "audit"];
};

const validateApiPrefix = (value: string | undefined): string => {
  const prefix = value?.trim() || "/api/v1";
  if (!prefix.startsWith("/")) {
    throw new Error(`Invalid API_PREFIX: ${prefix}. It must start with '/'.`);
  }
  return prefix;
};

const parseRateLimitStore = (rawValue: string | undefined): "memory" | "redis" => {
  const normalized = rawValue?.trim().toLowerCase();
  if (!normalized || normalized.length === 0) return "redis";
  if (normalized === "memory" || normalized === "redis") return normalized;
  throw new Error(`Invalid RATE_LIMIT_STORE value: ${rawValue}`);
};

const resolveCorsAllowedOrigins = (
  nodeEnv: AppEnv["nodeEnv"],
  corsAllowedOriginsRaw: string | undefined,
  corsOriginFallbackRaw: string | undefined
): string[] => {
  const fromList = parseCsv(corsAllowedOriginsRaw);
  const fallback = corsOriginFallbackRaw?.trim();
  const origins = fromList.length > 0 ? fromList : fallback ? [fallback] : ["http://localhost:5173"];

  if (nodeEnv === "production") {
    if (origins.length === 0) {
      throw new Error("CORS_ALLOWED_ORIGINS is required in production.");
    }

    if (origins.includes("*")) {
      throw new Error("CORS wildcard '*' is not allowed in production.");
    }

    for (const origin of origins) {
      const parsed = new URL(origin);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        throw new Error(`Loopback origin not allowed in production CORS: ${origin}`);
      }
    }
  }

  return origins;
};

const validateJwtSecret = (
  name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET",
  secret: string,
  nodeEnv: AppEnv["nodeEnv"]
): string => {
  const normalized = secret.trim();
  if (normalized.length === 0) {
    throw new Error(`${name} cannot be empty.`);
  }

  if (nodeEnv === "production") {
    if (normalized.length < 32) {
      throw new Error(`${name} must have at least 32 chars in production.`);
    }
    if (
      normalized.toLowerCase().includes("replace_in_local_env") ||
      normalized.toLowerCase().includes("ci_")
    ) {
      throw new Error(`${name} appears to be a placeholder/weak secret in production.`);
    }
  }

  return normalized;
};

const nodeEnv = toNodeEnv(process.env.NODE_ENV);
const metricsToken = process.env.METRICS_TOKEN?.trim() || null;
const trustProxy = toBoolean(process.env.TRUST_PROXY, nodeEnv === "production");
const trustedProxyCidrs = parseCsv(process.env.TRUSTED_PROXY_CIDRS);
const rateLimitStore = parseRateLimitStore(process.env.RATE_LIMIT_STORE);
const rateLimitRequireRedis = toBoolean(
  process.env.RATE_LIMIT_REQUIRE_REDIS,
  nodeEnv === "production"
);

if (nodeEnv === "production" && !metricsToken) {
  throw new Error("METRICS_TOKEN is required in production.");
}

if (nodeEnv === "production" && trustProxy && trustedProxyCidrs.length === 0) {
  throw new Error("TRUSTED_PROXY_CIDRS is required in production when TRUST_PROXY=true.");
}

export const env: AppEnv = {
  nodeEnv,
  port: toPort(process.env.PORT, 4000),
  trustProxy,
  trustedProxyCidrs,
  apiPrefix: validateApiPrefix(process.env.API_PREFIX),
  corsAllowedOrigins: resolveCorsAllowedOrigins(
    nodeEnv,
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.CORS_ORIGIN
  ),
  metricsToken,
  metricsCollectorEnabled: toBoolean(
    process.env.METRICS_COLLECTOR_ENABLED,
    nodeEnv === "test" ? false : true
  ),
  metricsCollectorIntervalSeconds: toNumber(
    "METRICS_COLLECTOR_INTERVAL_SECONDS",
    process.env.METRICS_COLLECTOR_INTERVAL_SECONDS,
    60
  ),
  metricsRetentionDays: toNumber("METRICS_RETENTION_DAYS", process.env.METRICS_RETENTION_DAYS, 30),
  alertsEvaluatorEnabled: toBoolean(
    process.env.ALERTS_EVALUATOR_ENABLED,
    nodeEnv === "test" ? false : true
  ),
  alertsEvaluatorIntervalSeconds: toNumber(
    "ALERTS_EVALUATOR_INTERVAL_SECONDS",
    process.env.ALERTS_EVALUATOR_INTERVAL_SECONDS,
    300
  ),
  alertsNotificationCooldownSeconds: toNumber(
    "ALERTS_NOTIFICATION_COOLDOWN_SECONDS",
    process.env.ALERTS_NOTIFICATION_COOLDOWN_SECONDS,
    900
  ),
  alertsNotifyChannels: toNotifyChannels(process.env.ALERTS_NOTIFY_CHANNELS),
  rateLimitEnabled: toBoolean(
    process.env.RATE_LIMIT_ENABLED,
    nodeEnv === "test" ? false : true
  ),
  rateLimitStore,
  rateLimitRequireRedis,
  rateLimitWindowSeconds: toNumber(
    "RATE_LIMIT_WINDOW_SECONDS",
    process.env.RATE_LIMIT_WINDOW_SECONDS,
    60
  ),
  rateLimitAuthLoginMax: toNumber(
    "RATE_LIMIT_AUTH_LOGIN_MAX",
    process.env.RATE_LIMIT_AUTH_LOGIN_MAX,
    10
  ),
  rateLimitAuthRefreshMax: toNumber(
    "RATE_LIMIT_AUTH_REFRESH_MAX",
    process.env.RATE_LIMIT_AUTH_REFRESH_MAX,
    20
  ),
  rateLimitInternalMax: toNumber(
    "RATE_LIMIT_INTERNAL_MAX",
    process.env.RATE_LIMIT_INTERNAL_MAX,
    120
  ),
  databaseUrl: validateUrl("DATABASE_URL", required("DATABASE_URL", process.env.DATABASE_URL)),
  redisUrl: validateUrl("REDIS_URL", process.env.REDIS_URL?.trim() || "redis://localhost:6379"),
  jwtAccessSecret: validateJwtSecret(
    "JWT_ACCESS_SECRET",
    required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
    nodeEnv
  ),
  jwtRefreshSecret: validateJwtSecret(
    "JWT_REFRESH_SECRET",
    required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
    nodeEnv
  ),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d"
};
