import type { Request, Response, NextFunction } from "express";
import { env } from "../lib/env";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";

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

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const windowMs = options.windowSeconds * 1000;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!env.rateLimitEnabled) {
      next();
      return;
    }

    cleanupExpiredCounters(windowMs);
    const key = `${options.id}:${(options.keyResolver ?? defaultKeyResolver)(req)}`;
    const now = Date.now();
    const current = counters.get(key);

    if (!current || now - current.windowStartedAt >= windowMs) {
      counters.set(key, { count: 1, windowStartedAt: now });
      next();
      return;
    }

    if (current.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.windowStartedAt + windowMs - now) / 1000)
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      sendApiError(
        res,
        429,
        API_ERROR_CODE.rateLimited,
        "Demasiadas solicitudes. Intente nuevamente en breve.",
        {
          limiter: options.id,
          retryAfterSeconds
        }
      );
      return;
    }

    current.count += 1;
    counters.set(key, current);
    next();
  };
};
