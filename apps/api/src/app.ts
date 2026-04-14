import cors from "cors";
import express from "express";
import { randomUUID } from "crypto";
import { nowIso } from "@pac/shared-utils";
import type { HealthStatus } from "@pac/shared-types";
import { env } from "./lib/env";
import { API_ERROR_CODE, sendApiError } from "./lib/api-error";
import { logger } from "./lib/logger";
import { operationalMetricsService } from "./modules/metrics/operational-metrics.service";
import { authRouter } from "./modules/auth/auth.routes";
import { expedientesRouter } from "./routes/expedientes.routes";
import { internalRouter } from "./routes/internal.routes";

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

const resolveRequestId = (requestIdHeader: string | undefined): string => {
  const normalized = requestIdHeader?.trim();
  if (
    !normalized ||
    normalized.length > REQUEST_ID_MAX_LENGTH ||
    !REQUEST_ID_PATTERN.test(normalized)
  ) {
    return randomUUID();
  }

  return normalized;
};

export const createApp = (): express.Express => {
  const app = express();
  const apiPrefix = env.apiPrefix;
  const corsAllowedOrigins = env.corsAllowedOrigins;

  app.disable("x-powered-by");
  if (env.trustedProxyCidrs.length > 0) {
    app.set("trust proxy", env.trustedProxyCidrs);
  } else {
    app.set("trust proxy", env.trustProxy);
  }

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    if (env.nodeEnv === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (corsAllowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS origin not allowed."));
      }
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = resolveRequestId(req.header("x-request-id") ?? undefined);
    res.setHeader("x-request-id", requestId);
    res.locals.requestId = requestId;

    logger.info("http.request.started", "Incoming API request.", {
      requestId,
      method: req.method,
      path: req.originalUrl
    });

    res.on("finish", () => {
      const endedAt = process.hrtime.bigint();
      const durationMs = Number(endedAt - startedAt) / 1_000_000;
      const normalizedDurationMs = Number(durationMs.toFixed(2));
      const path = req.originalUrl;

      operationalMetricsService.recordHttpRequest({
        path,
        statusCode: res.statusCode,
        durationMs: normalizedDurationMs
      });

      logger.info("http.request.completed", "API request completed.", {
        requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: normalizedDurationMs
      });
    });

    next();
  });

  app.get(`${apiPrefix}/health`, (_req, res) => {
    const payload: HealthStatus = {
      service: "api",
      status: "ok",
      timestamp: nowIso()
    };

    res.json(payload);
  });

  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/expedientes`, expedientesRouter);
  app.use(`${apiPrefix}/internal`, internalRouter);

  app.use((_req, res) => {
    sendApiError(res, 404, API_ERROR_CODE.notFound, "Endpoint no encontrado.");
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      void _next;
      logger.error("http.request.failed", "Unhandled API error.", err, {
        requestId: res.locals.requestId,
        method: req.method,
        path: req.originalUrl
      });
      sendApiError(res, 500, API_ERROR_CODE.internalError, "Error interno del servidor.");
    }
  );

  return app;
};
