type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  apiPrefix: string;
  corsOrigin: string;
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
  databaseUrl: validateUrl("DATABASE_URL", required("DATABASE_URL", process.env.DATABASE_URL)),
  redisUrl: validateUrl("REDIS_URL", process.env.REDIS_URL?.trim() || "redis://localhost:6379"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d"
};
