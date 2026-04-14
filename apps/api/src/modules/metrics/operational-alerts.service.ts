import type { OperationalAlertEventType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import { auditService } from "../audit/audit.service";
import { METRIC_THRESHOLDS } from "./operational-metrics.service";
import { metricsHistoryService } from "./metrics-history.service";

type RuleSeverity = "warning" | "critical";
type AlertTransition = "triggered" | "resolved" | "ongoing";
type RuleId = "error_rate_24h" | "p95_latency_24h" | "count_5xx_24h";

type PaginationInput = {
  page: number;
  pageSize: number;
  ruleId?: string;
};

type AcknowledgeInput = {
  ruleId: string;
  comment: string;
  operator?: string | null;
};

type SilenceInput = {
  ruleId: string;
  reason: string;
  silencedUntil: string;
  operator?: string | null;
};

type UnsilenceInput = {
  ruleId: string;
  reason?: string | null;
  operator?: string | null;
};

type OperationalAlertRule = {
  id: RuleId;
  metric: "error_rate" | "p95_latency" | "5xx_count";
  severity: RuleSeverity;
  message: string;
  evaluate: (summary: HistoricalSummary) => number;
  isBreached: (value: number) => boolean;
  thresholdLabel: string;
};

type HistoricalSummary = {
  samples: number;
  errorRate: number;
  p95Latency: number;
  count5xx: number;
};

type AlertState = {
  isActive: boolean;
  isSilenced: boolean;
  silencedUntil: string | null;
  lastValue: number;
  lastEvaluatedAt: string | null;
  lastTriggeredAt: string | null;
  lastResolvedAt: string | null;
  lastNotifiedAt: string | null;
  lastAcknowledgedAt: string | null;
  lastSilencedAt: string | null;
  lastUnsilencedAt: string | null;
};

const MIN_SAMPLES_FOR_EVALUATION = 3;
const MS_PER_SECOND = 1_000;
const MAX_PAGE_SIZE = 100;

const rules: OperationalAlertRule[] = [
  {
    id: "error_rate_24h",
    metric: "error_rate",
    severity: "warning",
    message: "Error rate 24h sobre umbral operativo.",
    evaluate: (summary) => summary.errorRate,
    isBreached: (value) => value > METRIC_THRESHOLDS.error_rate.max,
    thresholdLabel: `>${METRIC_THRESHOLDS.error_rate.max}`
  },
  {
    id: "p95_latency_24h",
    metric: "p95_latency",
    severity: "warning",
    message: "P95 latency 24h sobre umbral operativo.",
    evaluate: (summary) => summary.p95Latency,
    isBreached: (value) => value > METRIC_THRESHOLDS.p95_latency.max,
    thresholdLabel: `>${METRIC_THRESHOLDS.p95_latency.max}ms`
  },
  {
    id: "count_5xx_24h",
    metric: "5xx_count",
    severity: "critical",
    message: "Conteo 5xx 24h sobre umbral operativo.",
    evaluate: (summary) => summary.count5xx,
    isBreached: (value) => value >= METRIC_THRESHOLDS["5xx_count"].max,
    thresholdLabel: `>=${METRIC_THRESHOLDS["5xx_count"].max}`
  }
];

const initialState = (): AlertState => ({
  isActive: false,
  isSilenced: false,
  silencedUntil: null,
  lastValue: 0,
  lastEvaluatedAt: null,
  lastTriggeredAt: null,
  lastResolvedAt: null,
  lastNotifiedAt: null,
  lastAcknowledgedAt: null,
  lastSilencedAt: null,
  lastUnsilencedAt: null
});

const state: Record<RuleId, AlertState> = {
  error_rate_24h: initialState(),
  p95_latency_24h: initialState(),
  count_5xx_24h: initialState()
};

let evaluatorInterval: NodeJS.Timeout | null = null;
let lastEvaluationAt: string | null = null;
let lastEvaluationStatus: "ok" | "degraded" | "insufficient_data" | "error" = "insufficient_data";
let lastEvaluationMessage = "Sin evaluaciones ejecutadas.";

const nowIso = (): string => new Date().toISOString();

const normalizeText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getRuleOrThrow = (ruleId: string): OperationalAlertRule => {
  const target = rules.find((rule) => rule.id === ruleId);
  if (!target) throw new Error("INVALID_RULE_ID");
  return target;
};

const parseDateOrThrow = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_DATE");
  return parsed;
};

const normalizePagination = (input: PaginationInput) => {
  const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
  const pageSize =
    Number.isFinite(input.pageSize) && input.pageSize > 0
      ? Math.min(MAX_PAGE_SIZE, Math.floor(input.pageSize))
      : 20;
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    ruleId: normalizeText(input.ruleId ?? null)
  };
};

const shouldNotify = (ruleState: AlertState): boolean => {
  const now = Date.now();
  if (!ruleState.lastNotifiedAt) return true;
  const elapsedMs = now - new Date(ruleState.lastNotifiedAt).getTime();
  return elapsedMs >= env.alertsNotificationCooldownSeconds * MS_PER_SECOND;
};

const recordEvent = async (params: {
  rule: OperationalAlertRule;
  eventType: OperationalAlertEventType;
  value?: number;
  payload?: Prisma.InputJsonObject;
  operator?: string | null;
  comment?: string | null;
}): Promise<void> => {
  await prisma.operationalAlertEvent.create({
    data: {
      ruleId: params.rule.id,
      eventType: params.eventType,
      severity: params.rule.severity,
      metric: params.rule.metric,
      value: params.value,
      threshold: params.rule.thresholdLabel,
      payload: params.payload,
      operator: normalizeText(params.operator ?? null)
    }
  });

  const metadata: Prisma.InputJsonObject = {
    eventType: params.eventType,
    value: params.value ?? null,
    payload: (params.payload ?? null) as Prisma.InputJsonValue | null,
    comment: params.comment ?? null
  };

  await auditService.safeLog({
    accion: `ops.alert.${params.eventType.toLowerCase()}`,
    scopeType: "SISTEMA",
    scopeId: params.rule.id,
    entityType: "SYSTEM_ALERT",
    entityId: params.rule.id,
    metadata,
    comentario: params.comment ?? params.rule.message
  });
};

const notifyChannels = async (
  transition: AlertTransition,
  rule: OperationalAlertRule,
  value: number
): Promise<void> => {
  const payload = {
    ruleId: rule.id,
    metric: rule.metric,
    severity: rule.severity,
    transition,
    value,
    threshold: rule.thresholdLabel,
    evaluatedAt: nowIso()
  };

  if (env.alertsNotifyChannels.includes("log")) {
    const level = rule.severity === "critical" ? "error" : "warn";
    if (level === "error") {
      logger.error("alerts.operational.transition", "Operational alert transition.", undefined, payload);
    } else {
      logger.warn("alerts.operational.transition", "Operational alert transition.", payload);
    }
  }

  if (env.alertsNotifyChannels.includes("audit")) {
    await auditService.safeLog({
      accion: `ops.alert.${transition}`,
      scopeType: "SISTEMA",
      scopeId: rule.id,
      entityType: "SYSTEM_ALERT",
      entityId: rule.id,
      metadata: payload,
      comentario: rule.message
    });
  }
};

const resolveSilenceState = async (rule: OperationalAlertRule): Promise<void> => {
  const ruleState = state[rule.id];
  const latestSilence = await prisma.operationalAlertAction.findFirst({
    where: { ruleId: rule.id, actionType: "SILENCE" },
    orderBy: { createdAt: "desc" }
  });

  if (!latestSilence) {
    ruleState.isSilenced = false;
    ruleState.silencedUntil = null;
    return;
  }

  const latestUnsilence = await prisma.operationalAlertAction.findFirst({
    where: {
      ruleId: rule.id,
      actionType: "UNSILENCE",
      createdAt: { gt: latestSilence.createdAt }
    },
    orderBy: { createdAt: "desc" }
  });

  if (latestUnsilence) {
    ruleState.isSilenced = false;
    ruleState.silencedUntil = null;
    return;
  }

  const now = new Date();
  const until = latestSilence.silencedUntil;
  if (until && until.getTime() <= now.getTime()) {
    await prisma.operationalAlertAction.create({
      data: {
        ruleId: rule.id,
        actionType: "UNSILENCE",
        comment: "Silencio expirado automaticamente.",
        operator: "system:auto-expire",
        payload: {
          sourceActionId: latestSilence.id
        }
      }
    });
    await recordEvent({
      rule,
      eventType: "UNSILENCED",
      value: ruleState.lastValue,
      operator: "system:auto-expire",
      comment: "Silencio expirado automaticamente."
    });
    ruleState.lastUnsilencedAt = nowIso();
    ruleState.isSilenced = false;
    ruleState.silencedUntil = null;
    return;
  }

  ruleState.isSilenced = true;
  ruleState.silencedUntil = until?.toISOString() ?? null;
};

const applyRule = async (
  rule: OperationalAlertRule,
  summary: HistoricalSummary
): Promise<{ transition: AlertTransition; isBreached: boolean; value: number }> => {
  await resolveSilenceState(rule);
  const value = rule.evaluate(summary);
  const isBreached = rule.isBreached(value);
  const evaluatedAt = nowIso();
  const ruleState = state[rule.id];
  ruleState.lastValue = value;
  ruleState.lastEvaluatedAt = evaluatedAt;

  if (isBreached && !ruleState.isActive) {
    ruleState.isActive = true;
    ruleState.lastTriggeredAt = evaluatedAt;
    await recordEvent({ rule, eventType: "TRIGGERED", value });
    if (!ruleState.isSilenced && shouldNotify(ruleState)) {
      await notifyChannels("triggered", rule, value);
      ruleState.lastNotifiedAt = evaluatedAt;
    }
    return { transition: "triggered", isBreached, value };
  }

  if (!isBreached && ruleState.isActive) {
    ruleState.isActive = false;
    ruleState.lastResolvedAt = evaluatedAt;
    await recordEvent({ rule, eventType: "RESOLVED", value });
    if (!ruleState.isSilenced) {
      await notifyChannels("resolved", rule, value);
      ruleState.lastNotifiedAt = evaluatedAt;
    }
    return { transition: "resolved", isBreached, value };
  }

  if (isBreached && ruleState.isActive && !ruleState.isSilenced && shouldNotify(ruleState)) {
    await notifyChannels("ongoing", rule, value);
    await recordEvent({ rule, eventType: "ONGOING", value });
    ruleState.lastNotifiedAt = evaluatedAt;
  }

  return { transition: "ongoing", isBreached, value };
};

export const operationalAlertsService = {
  async evaluateNow(): Promise<void> {
    try {
      const history = await metricsHistoryService.getHistoricalMetrics("24h");
      const summary = history.summary;
      lastEvaluationAt = nowIso();

      if (summary.samples < MIN_SAMPLES_FOR_EVALUATION) {
        lastEvaluationStatus = "insufficient_data";
        lastEvaluationMessage = `Datos insuficientes para evaluar alertas (samples=${summary.samples}).`;
        return;
      }

      const transitions = await Promise.all(rules.map((rule) => applyRule(rule, summary)));
      const breached = transitions.filter((item) => item.isBreached).length;
      lastEvaluationStatus = breached > 0 ? "degraded" : "ok";
      lastEvaluationMessage =
        breached > 0
          ? `Alertas activas: ${breached}/${rules.length}.`
          : "Sin alertas activas en evaluacion 24h.";
    } catch (error) {
      lastEvaluationAt = nowIso();
      lastEvaluationStatus = "error";
      lastEvaluationMessage = "Error evaluando alertas operativas.";
      logger.error(
        "alerts.operational.evaluation_failed",
        "Failed to evaluate operational alerts.",
        error
      );
    }
  },

  startEvaluator(): void {
    if (!env.alertsEvaluatorEnabled) {
      logger.info("jobs.alerts_evaluator.disabled", "Operational alerts evaluator disabled.");
      return;
    }
    if (evaluatorInterval) return;

    void this.evaluateNow();
    evaluatorInterval = setInterval(() => {
      void this.evaluateNow();
    }, env.alertsEvaluatorIntervalSeconds * MS_PER_SECOND);

    logger.info("jobs.alerts_evaluator.started", "Operational alerts evaluator started.", {
      intervalSeconds: env.alertsEvaluatorIntervalSeconds,
      cooldownSeconds: env.alertsNotificationCooldownSeconds,
      channels: env.alertsNotifyChannels
    });
  },

  stopEvaluator(): void {
    if (!evaluatorInterval) return;
    clearInterval(evaluatorInterval);
    evaluatorInterval = null;
    logger.info("jobs.alerts_evaluator.stopped", "Operational alerts evaluator stopped.");
  },

  async acknowledge(input: AcknowledgeInput) {
    const comment = normalizeText(input.comment);
    if (!comment) throw new Error("INVALID_COMMENT");
    const rule = getRuleOrThrow(input.ruleId);
    const createdAt = nowIso();

    await prisma.operationalAlertAction.create({
      data: {
        ruleId: rule.id,
        actionType: "ACKNOWLEDGE",
        comment,
        operator: normalizeText(input.operator ?? null),
        payload: {
          acknowledgedAt: createdAt
        }
      }
    });
    state[rule.id].lastAcknowledgedAt = createdAt;
    await recordEvent({
      rule,
      eventType: "ACKNOWLEDGED",
      value: state[rule.id].lastValue,
      operator: input.operator,
      comment
    });
    return { ok: true, ruleId: rule.id, action: "ACKNOWLEDGE", acknowledgedAt: createdAt };
  },

  async silence(input: SilenceInput) {
    const reason = normalizeText(input.reason);
    if (!reason) throw new Error("INVALID_REASON");
    const rule = getRuleOrThrow(input.ruleId);
    const silencedUntil = parseDateOrThrow(input.silencedUntil);
    if (silencedUntil.getTime() <= Date.now()) throw new Error("INVALID_SILENCED_UNTIL");
    const silencedAt = nowIso();

    await prisma.operationalAlertAction.create({
      data: {
        ruleId: rule.id,
        actionType: "SILENCE",
        comment: reason,
        silencedUntil,
        operator: normalizeText(input.operator ?? null),
        payload: {
          silencedAt
        }
      }
    });
    state[rule.id].isSilenced = true;
    state[rule.id].silencedUntil = silencedUntil.toISOString();
    state[rule.id].lastSilencedAt = silencedAt;
    await recordEvent({
      rule,
      eventType: "SILENCED",
      value: state[rule.id].lastValue,
      operator: input.operator,
      comment: reason,
      payload: { silencedUntil: silencedUntil.toISOString() }
    });
    return {
      ok: true,
      ruleId: rule.id,
      action: "SILENCE",
      silencedAt,
      silencedUntil: silencedUntil.toISOString()
    };
  },

  async unsilence(input: UnsilenceInput) {
    const rule = getRuleOrThrow(input.ruleId);
    const reason = normalizeText(input.reason ?? null) ?? "Unsilence manual.";
    const unsilencedAt = nowIso();

    await prisma.operationalAlertAction.create({
      data: {
        ruleId: rule.id,
        actionType: "UNSILENCE",
        comment: reason,
        operator: normalizeText(input.operator ?? null),
        payload: {
          unsilencedAt
        }
      }
    });
    state[rule.id].isSilenced = false;
    state[rule.id].silencedUntil = null;
    state[rule.id].lastUnsilencedAt = unsilencedAt;
    await recordEvent({
      rule,
      eventType: "UNSILENCED",
      value: state[rule.id].lastValue,
      operator: input.operator,
      comment: reason
    });
    return { ok: true, ruleId: rule.id, action: "UNSILENCE", unsilencedAt };
  },

  async listActions(input: PaginationInput) {
    const { page, pageSize, skip, ruleId } = normalizePagination(input);
    const where = ruleId ? { ruleId } : {};
    const [total, items] = await Promise.all([
      prisma.operationalAlertAction.count({ where }),
      prisma.operationalAlertAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);
    return {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNext: page * pageSize < total,
      items
    };
  },

  async listEvents(input: PaginationInput) {
    const { page, pageSize, skip, ruleId } = normalizePagination(input);
    const where = ruleId ? { ruleId } : {};
    const [total, items] = await Promise.all([
      prisma.operationalAlertEvent.count({ where }),
      prisma.operationalAlertEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      })
    ]);
    return {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNext: page * pageSize < total,
      items
    };
  },

  status() {
    return {
      now: nowIso(),
      enabled: env.alertsEvaluatorEnabled,
      intervalSeconds: env.alertsEvaluatorIntervalSeconds,
      cooldownSeconds: env.alertsNotificationCooldownSeconds,
      channels: env.alertsNotifyChannels,
      lastEvaluationAt,
      lastEvaluationStatus,
      lastEvaluationMessage,
      rules: rules.map((rule) => ({
        id: rule.id,
        metric: rule.metric,
        severity: rule.severity,
        threshold: rule.thresholdLabel,
        message: rule.message,
        state: state[rule.id]
      }))
    };
  }
};
