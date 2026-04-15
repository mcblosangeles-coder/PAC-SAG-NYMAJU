import cors from "cors";
import express from "express";
import { randomUUID } from "crypto";
import { nowIso } from "@pac/shared-utils";
import type { HealthStatus } from "@pac/shared-types";
import { env } from "./lib/env";
import { API_ERROR_CODE, sendApiError } from "./lib/api-error";
import { logger } from "./lib/logger";
import {
  operationalMetricsService,
  type TrafficProfile,
  type TrafficProfileHeaderStatus
} from "./modules/metrics/operational-metrics.service";
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

const toPathname = (originalUrl: string): string => originalUrl.split("?")[0] ?? originalUrl;

const resolveTrafficProfile = (input: {
  rawHeader: string | undefined;
  nodeEnv: "development" | "test" | "production";
  forceValidation: boolean;
}): { profile: TrafficProfile; headerStatus: TrafficProfileHeaderStatus; fromOverride: boolean } => {
  const normalized = input.rawHeader?.trim().toLowerCase();
  const headerStatus: TrafficProfileHeaderStatus =
    !normalized ? "missing" : normalized === "validation" || normalized === "operational" ? "valid" : "invalid";

  if (input.forceValidation) {
    return { profile: "validation", headerStatus, fromOverride: true };
  }

  if (normalized === "validation") return { profile: "validation", headerStatus, fromOverride: false };
  if (normalized === "operational") return { profile: "operational", headerStatus, fromOverride: false };
  if (input.nodeEnv === "test") return { profile: "validation", headerStatus, fromOverride: false };
  return { profile: "operational", headerStatus, fromOverride: false };
};

const isQaValidationRoute = (originalUrl: string): boolean => {
  const pathname = toPathname(originalUrl);
  return pathname.startsWith(env.qaInternalPathPrefix);
};

const isQaValidationHost = (hostname: string | undefined): boolean => {
  if (!hostname) return false;
  return env.qaInternalHostnames.includes(hostname.toLowerCase());
};

const shouldRejectByProfilePolicy = (
  nodeEnv: "development" | "test" | "production",
  headerStatus: TrafficProfileHeaderStatus
): boolean => {
  if (nodeEnv !== "production") return false;
  if (headerStatus === "missing" && env.trafficProfileRejectOnMissingHeader) return true;
  if (headerStatus === "invalid" && env.trafficProfileRejectOnInvalidHeader) return true;
  return false;
};

const resolveRejectMessage = (headerStatus: TrafficProfileHeaderStatus): string => {
  if (headerStatus === "missing") {
    return "Header x-traffic-profile requerido en production (operational|validation).";
  }
  return "Header x-traffic-profile invalido. Use operational o validation.";
};

const resolveSecurityEvent = (headerStatus: TrafficProfileHeaderStatus): string => {
  if (headerStatus === "missing") return "security.metrics_profile_missing";
  if (headerStatus === "invalid") return "security.metrics_profile_invalid";
  return "security.metrics_profile_valid";
};

const resolveSecurityMessage = (headerStatus: TrafficProfileHeaderStatus): string => {
  if (headerStatus === "missing") return "Request without x-traffic-profile.";
  if (headerStatus === "invalid") return "Request with invalid x-traffic-profile value.";
  return "Request with valid x-traffic-profile value.";
};

const resolveHeaderValue = (rawHeader: string | undefined): string | null => {
  const normalized = rawHeader?.trim().toLowerCase();
  if (!normalized) return null;
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
    const rawTrafficProfileHeader = req.header("x-traffic-profile") ?? undefined;
    const forceValidation =
      isQaValidationRoute(req.originalUrl) || isQaValidationHost(req.hostname ?? undefined);
    const resolvedProfile = resolveTrafficProfile({
      rawHeader: rawTrafficProfileHeader,
      nodeEnv: env.nodeEnv,
      forceValidation
    });
    const trafficProfile = resolvedProfile.profile;
    const profileHeaderStatus = resolvedProfile.headerStatus;

    res.setHeader("x-request-id", requestId);
    res.locals.requestId = requestId;
    res.locals.trafficProfile = trafficProfile;
    res.locals.profileHeaderStatus = profileHeaderStatus;

    if (env.nodeEnv === "production") {
      if (profileHeaderStatus !== "valid") {
        logger.warn(resolveSecurityEvent(profileHeaderStatus), resolveSecurityMessage(profileHeaderStatus), {
          requestId,
          method: req.method,
          path: req.originalUrl,
          hostname: req.hostname,
          headerValue: resolveHeaderValue(rawTrafficProfileHeader),
          forcedProfile: forceValidation
        });
      }
      if (
        !forceValidation &&
        shouldRejectByProfilePolicy(env.nodeEnv, profileHeaderStatus)
      ) {
        return sendApiError(
          res,
          400,
          API_ERROR_CODE.invalidParam,
          resolveRejectMessage(profileHeaderStatus)
        );
      }
    }

    logger.info("http.request.started", "Incoming API request.", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      trafficProfile,
      profileHeaderStatus
    });

    res.on("finish", () => {
      const endedAt = process.hrtime.bigint();
      const durationMs = Number(endedAt - startedAt) / 1_000_000;
      const normalizedDurationMs = Number(durationMs.toFixed(2));
      const path = req.originalUrl;

      operationalMetricsService.recordHttpRequest({
        path,
        statusCode: res.statusCode,
        durationMs: normalizedDurationMs,
        trafficProfile,
        profileHeaderStatus
      });

      logger.info("http.request.completed", "API request completed.", {
        requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: normalizedDurationMs,
        trafficProfile,
        profileHeaderStatus
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
  app.use(env.qaInternalPathPrefix, internalRouter);

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
