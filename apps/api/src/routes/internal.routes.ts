import { Router, type Request, type Response } from "express";
import { env } from "../lib/env";
import { API_ERROR_CODE, sendApiError } from "../lib/api-error";
import { logger } from "../lib/logger";
import { createRateLimitMiddleware } from "../middlewares/rate-limit";
import { operationalAlertsService } from "../modules/metrics/operational-alerts.service";
import { metricsHistoryService } from "../modules/metrics/metrics-history.service";
import { operationalMetricsService } from "../modules/metrics/operational-metrics.service";
import type { MetricsProfile } from "../modules/metrics/operational-metrics.service";

export const internalRouter: Router = Router();
const MAX_PAGE_SIZE = 100;

const internalRateLimit = createRateLimitMiddleware({
  id: "internal.api",
  windowSeconds: env.rateLimitWindowSeconds,
  maxRequests: env.rateLimitInternalMax,
  keyResolver: (req) => req.ip || "unknown-ip"
});

internalRouter.use(internalRateLimit);

const ensureMetricsAccess = (req: Request, res: Response): boolean => {
  const configuredToken = env.metricsToken;
  if (configuredToken) {
    const token = req.header("x-metrics-token")?.trim();
    if (!token || token !== configuredToken) {
      sendApiError(res, 403, API_ERROR_CODE.forbidden, "No autorizado para metricas internas.");
      return false;
    }
  }

  return true;
};

const parsePagination = (req: Request): { page: number; pageSize: number } => {
  const pageRaw = Number(String(req.query.page ?? "1"));
  const pageSizeRaw = Number(String(req.query.pageSize ?? "20"));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(MAX_PAGE_SIZE, Math.floor(pageSizeRaw))
      : 20;
  return { page, pageSize };
};

const parseMetricsProfile = (req: Request): MetricsProfile | null => {
  const raw = String(req.query.profile ?? "operational").toLowerCase();
  if (raw === "all" || raw === "operational" || raw === "validation") {
    return raw;
  }
  return null;
};

internalRouter.get("/metrics", (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const profile = parseMetricsProfile(req);
  if (!profile) {
    return sendApiError(
      res,
      400,
      API_ERROR_CODE.invalidParam,
      "Parametro profile invalido. Use all, operational o validation."
    );
  }
  return res.status(200).json(operationalMetricsService.snapshot(profile));
});

internalRouter.get("/metrics/history", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;

  const rawWindow = String(req.query.window ?? "24h").toLowerCase();
  if (rawWindow !== "24h" && rawWindow !== "7d") {
    return sendApiError(
      res,
      400,
      API_ERROR_CODE.invalidParam,
      "Parametro window invalido. Use 24h o 7d."
    );
  }
  const profile = parseMetricsProfile(req);
  if (!profile) {
    return sendApiError(
      res,
      400,
      API_ERROR_CODE.invalidParam,
      "Parametro profile invalido. Use all, operational o validation."
    );
  }

  try {
    const history = await metricsHistoryService.getHistoricalMetrics(
      rawWindow as "24h" | "7d",
      profile
    );
    return res.status(200).json(history);
  } catch (error) {
    logger.error("db.metrics_history.read_failed", "Failed to read metrics history.", error, {
      requestId: res.locals.requestId
    });
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "No fue posible consultar metricas.");
  }
});

internalRouter.get("/alerts/operational", (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const profile = parseMetricsProfile(req);
  if (!profile) {
    return sendApiError(
      res,
      400,
      API_ERROR_CODE.invalidParam,
      "Parametro profile invalido. Use all, operational o validation."
    );
  }
  void operationalAlertsService.evaluateNow(profile);
  return res.status(200).json(operationalAlertsService.status());
});

internalRouter.post("/alerts/operational/evaluate", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const profile = parseMetricsProfile(req);
  if (!profile) {
    return sendApiError(
      res,
      400,
      API_ERROR_CODE.invalidParam,
      "Parametro profile invalido. Use all, operational o validation."
    );
  }
  await operationalAlertsService.evaluateNow(profile);
  return res.status(200).json(operationalAlertsService.status());
});

internalRouter.post("/alerts/operational/:ruleId/acknowledge", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const ruleId = req.params.ruleId?.trim();
  if (!ruleId) {
    return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "ruleId es requerido.");
  }
  const comment = typeof req.body?.comment === "string" ? req.body.comment : "";
  const operator = typeof req.body?.operator === "string" ? req.body.operator : null;
  try {
    const result = await operationalAlertsService.acknowledge({ ruleId, comment, operator });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RULE_ID") {
      return sendApiError(res, 404, API_ERROR_CODE.notFound, "Regla de alerta no encontrada.");
    }
    if (error instanceof Error && error.message === "INVALID_COMMENT") {
      return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "comment es requerido.");
    }
    logger.error("alerts.operational.acknowledge_failed", "Failed to acknowledge alert rule.", error, {
      requestId: res.locals.requestId,
      ruleId
    });
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "No fue posible registrar acknowledge.");
  }
});

internalRouter.post("/alerts/operational/:ruleId/silence", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const ruleId = req.params.ruleId?.trim();
  if (!ruleId) {
    return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "ruleId es requerido.");
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const silencedUntil =
    typeof req.body?.silencedUntil === "string" ? req.body.silencedUntil : "";
  const operator = typeof req.body?.operator === "string" ? req.body.operator : null;

  try {
    const result = await operationalAlertsService.silence({
      ruleId,
      reason,
      silencedUntil,
      operator
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RULE_ID") {
      return sendApiError(res, 404, API_ERROR_CODE.notFound, "Regla de alerta no encontrada.");
    }
    if (error instanceof Error && error.message === "INVALID_REASON") {
      return sendApiError(res, 400, API_ERROR_CODE.invalidPayload, "reason es requerido.");
    }
    if (
      error instanceof Error &&
      (error.message === "INVALID_DATE" || error.message === "INVALID_SILENCED_UNTIL")
    ) {
      return sendApiError(
        res,
        400,
        API_ERROR_CODE.invalidPayload,
        "silencedUntil debe ser fecha valida futura (ISO)."
      );
    }
    logger.error("alerts.operational.silence_failed", "Failed to silence alert rule.", error, {
      requestId: res.locals.requestId,
      ruleId
    });
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "No fue posible registrar silencio.");
  }
});

internalRouter.post("/alerts/operational/:ruleId/unsilence", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const ruleId = req.params.ruleId?.trim();
  if (!ruleId) {
    return sendApiError(res, 400, API_ERROR_CODE.invalidParam, "ruleId es requerido.");
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason : null;
  const operator = typeof req.body?.operator === "string" ? req.body.operator : null;
  try {
    const result = await operationalAlertsService.unsilence({ ruleId, reason, operator });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RULE_ID") {
      return sendApiError(res, 404, API_ERROR_CODE.notFound, "Regla de alerta no encontrada.");
    }
    logger.error("alerts.operational.unsilence_failed", "Failed to unsilence alert rule.", error, {
      requestId: res.locals.requestId,
      ruleId
    });
    return sendApiError(res, 500, API_ERROR_CODE.internalError, "No fue posible registrar unsilence.");
  }
});

internalRouter.get("/alerts/operational/actions", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const { page, pageSize } = parsePagination(req);
  const ruleId = typeof req.query.ruleId === "string" ? req.query.ruleId.trim() : undefined;
  const result = await operationalAlertsService.listActions({ page, pageSize, ruleId });
  return res.status(200).json(result);
});

internalRouter.get("/alerts/operational/events", async (req, res) => {
  if (!ensureMetricsAccess(req, res)) return;
  const { page, pageSize } = parsePagination(req);
  const ruleId = typeof req.query.ruleId === "string" ? req.query.ruleId.trim() : undefined;
  const result = await operationalAlertsService.listEvents({ page, pageSize, ruleId });
  return res.status(200).json(result);
});
