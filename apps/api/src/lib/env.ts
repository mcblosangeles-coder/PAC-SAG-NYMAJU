type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  metricsToken: string | null;
  metricsCollectorEnabled: boolean;
  metricsCollectorIntervalSeconds: number;
  metricsRetentionDays: number;
  alertsEvaluatorEnabled: boolean;
  alertsEvaluatorIntervalSeconds: number;
  alertsNotificationCooldownSeconds: number;
  alertsNotifyChannels: Array<"log" | "audit">;
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

  return value;
};

const toNumber = (name: string, value: string | undefined, fallback: number): number => {
  if (!value || value.trim().length === 0) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric environment variable: ${name}=${value}`);
  }
  return parsed;
};

const toNodeEnv = (value: string | undefined): AppEnv["nodeEnv"] => {
  if (value === "production" || value === "test") return value;
  return "development";
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value || value.trim().length === 0) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const toNotifyChannels = (rawValue: string | undefined): Array<"log" | "audit"> => {
  if (!rawValue || rawValue.trim().length === 0) return ["log", "audit"];
  const channels = rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "log" | "audit" => item === "log" || item === "audit");
  return channels.length > 0 ? channels : ["log", "audit"];
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

export const env: AppEnv = {
  nodeEnv: toNodeEnv(process.env.NODE_ENV),
  port: toNumber("PORT", process.env.PORT, 4000),
  apiPrefix: process.env.API_PREFIX?.trim() || "/api/v1",
  corsOrigin: process.env.CORS_ORIGIN?.trim() || "http://localhost:5173",
  metricsToken: process.env.METRICS_TOKEN?.trim() || null,
  metricsCollectorEnabled: toBoolean(
    process.env.METRICS_COLLECTOR_ENABLED,
    process.env.NODE_ENV === "test" ? false : true
  ),
  metricsCollectorIntervalSeconds: toNumber(
    "METRICS_COLLECTOR_INTERVAL_SECONDS",
    process.env.METRICS_COLLECTOR_INTERVAL_SECONDS,
    60
  ),
  metricsRetentionDays: toNumber("METRICS_RETENTION_DAYS", process.env.METRICS_RETENTION_DAYS, 30),
  alertsEvaluatorEnabled: toBoolean(
    process.env.ALERTS_EVALUATOR_ENABLED,
    process.env.NODE_ENV === "test" ? false : true
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
  databaseUrl: validateUrl("DATABASE_URL", required("DATABASE_URL", process.env.DATABASE_URL)),
  redisUrl: validateUrl("REDIS_URL", process.env.REDIS_URL?.trim() || "redis://localhost:6379"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d"
};
