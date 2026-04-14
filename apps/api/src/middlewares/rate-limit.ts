import type { Request, Response, NextFunction } from "express";
import { env } from "../lib/env";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";
import { connectRedis, getRedisClientOrNull } from "../lib/redis";
import { logger } from "../lib/logger";

type RateLimitOptions = {
  id: string;
  windowSeconds: number;
  maxRequests: number;
  keyResolver?: (req: Request) => string;
};

type CounterState = {
  count: number;
  windowStartedAt: number;
};

const counters = new Map<string, CounterState>();
let lastCleanupAt = Date.now();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupExpiredCounters = (windowMs: number): void => {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  for (const [key, value] of counters.entries()) {
    if (now - value.windowStartedAt > windowMs * 2) {
      counters.delete(key);
    }
  }
};

const defaultKeyResolver = (req: Request): string => {
  const requestId = req.header("x-request-id")?.trim() || "no-request-id";
  return `${req.ip}|${requestId}`;
};

const incrementWithRedis = async (
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttl: number }> => {
  const redis = getRedisClientOrNull() ?? (await connectRedis());
  const result = (await redis.eval(
    `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      local ttl = redis.call("TTL", KEYS[1])
      return { current, ttl }
    `,
    {
      keys: [key],
      arguments: [String(windowSeconds)]
    }
  )) as [number, number];

  const count = Number(result[0]);
  const ttlRaw = Number(result[1]);
  const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : windowSeconds;

  return { count, ttl };
};

const incrementInMemory = (
  key: string,
  windowMs: number
): { count: number; retryAfterSeconds: number } => {
  cleanupExpiredCounters(windowMs);
  const now = Date.now();
  const current = counters.get(key);

  if (!current || now - current.windowStartedAt >= windowMs) {
    counters.set(key, { count: 1, windowStartedAt: now });
    return { count: 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  current.count += 1;
  counters.set(key, current);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.windowStartedAt + windowMs - now) / 1000));

  return { count: current.count, retryAfterSeconds };
};

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const windowMs = options.windowSeconds * 1000;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const runtimeNodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
    const runtimeRateLimitEnabledRaw = process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase();
    const runtimeRateLimitExplicitlyEnabled =
      runtimeRateLimitEnabledRaw === "1" ||
      runtimeRateLimitEnabledRaw === "true" ||
      runtimeRateLimitEnabledRaw === "yes" ||
      runtimeRateLimitEnabledRaw === "on";

    if (runtimeNodeEnv === "test" && !runtimeRateLimitExplicitlyEnabled) {
      next();
      return;
    }

    if (!env.rateLimitEnabled) {
      next();
      return;
    }

    const key = `${options.id}:${(options.keyResolver ?? defaultKeyResolver)(req)}`;
    try {
      const useRedis = env.rateLimitStore === "redis";
      let count = 0;
      let retryAfterSeconds = options.windowSeconds;

      if (useRedis) {
        try {
          const redisState = await incrementWithRedis(key, options.windowSeconds);
          count = redisState.count;
          retryAfterSeconds = redisState.ttl;
        } catch (error) {
          if (env.rateLimitRequireRedis) {
            logger.error("security.rate_limit.redis_required_unavailable", "Redis unavailable for rate limiting.", error, {
              limiter: options.id,
              key
            });
            sendApiError(
              res,
              503,
              API_ERROR_CODE.internalError,
              "Servicio temporalmente no disponible."
            );
            return;
          }

          logger.warn("security.rate_limit.redis_unavailable_fallback", "Redis unavailable; using in-memory fallback.", {
            limiter: options.id
          });
          const memoryState = incrementInMemory(key, windowMs);
          count = memoryState.count;
          retryAfterSeconds = memoryState.retryAfterSeconds;
        }
      } else {
        const memoryState = incrementInMemory(key, windowMs);
        count = memoryState.count;
        retryAfterSeconds = memoryState.retryAfterSeconds;
      }

      if (count > options.maxRequests) {
        res.setHeader("Retry-After", String(Math.max(1, retryAfterSeconds)));
        sendApiError(
          res,
          429,
          API_ERROR_CODE.rateLimited,
          "Demasiadas solicitudes. Intente nuevamente en breve.",
          {
            limiter: options.id,
            retryAfterSeconds: Math.max(1, retryAfterSeconds)
          }
        );
        return;
      }

      next();
    } catch (error) {
      sendApiError(
        res,
        500,
        API_ERROR_CODE.internalError,
        "No fue posible aplicar controles de seguridad de rate limit.",
        {
          limiter: options.id,
          error: "rate_limit_middleware_failure"
        }
      );
      logger.error("security.rate_limit.middleware_failed", "Rate limit middleware failed.", error, {
        limiter: options.id,
        key
      });
    }
  };
};
