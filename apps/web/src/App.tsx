import { startTransition, useEffect, useState } from "react";

type HealthMetric = {
  value: number;
  unit: "ratio" | "ms" | "count";
  comparator: "lte" | "lt";
  threshold: number;
  isWithinThreshold: boolean;
};

type MetricsSnapshot = {
  metrics: Record<string, HealthMetric>;
  summary: {
    isHealthy: boolean;
    failingMetrics: string[];
  };
};

type AlertsStatus = {
  enabled: boolean;
  lastEvaluationAt: string | null;
  lastEvaluationStatus: "ok" | "degraded" | "insufficient_data" | "error";
  lastEvaluationMessage: string;
  rules: Array<{
    id: string;
    metric: string;
    severity: "warning" | "critical";
    threshold: string;
    message: string;
    state: {
      isActive: boolean;
      isSilenced?: boolean;
      silencedUntil?: string | null;
      lastValue: number;
      lastEvaluatedAt: string | null;
      lastAcknowledgedAt?: string | null;
      lastSilencedAt?: string | null;
      lastUnsilencedAt?: string | null;
    };
  }>;
};

type MetricsHistory = {
  window: "24h" | "7d";
  points: Array<{
    at: string;
    errorRate: number;
    p95Latency: number;
    count5xx: number;
  }>;
  summary: {
    samples: number;
    errorRate: number;
    p95Latency: number;
    count5xx: number;
  };
};

type AlertActionItem = {
  id: string;
  ruleId: string;
  actionType: "ACKNOWLEDGE" | "SILENCE" | "UNSILENCE";
  comment: string | null;
  silencedUntil: string | null;
  operator: string | null;
  createdAt: string;
};

type AlertEventItem = {
  id: string;
  ruleId: string;
  eventType: "TRIGGERED" | "ONGOING" | "RESOLVED" | "ACKNOWLEDGED" | "SILENCED" | "UNSILENCED";
  severity: "warning" | "critical";
  metric: string;
  value: number | null;
  threshold: string | null;
  operator: string | null;
  createdAt: string;
};

type PaginatedResponse<T> = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  items: T[];
};

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: {
    blockingAlertsCount?: number;
    blockingNcCount?: number;
    blockingReasons?: Array<{
      type: "ALERTA" | "NC";
      id: string;
      code?: string | null;
      severity: string;
      title: string;
      description: string;
    }>;
  };
};

type LoginResponse = {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

type ErrorUxContext =
  | "inbox"
  | "detail.summary"
  | "detail.workflow"
  | "detail.history"
  | "action.change_state"
  | "action.reopen_stage"
  | "default";

type ExpedienteSummary = {
  expedienteId: string;
  codigoInterno: string;
  estadoGlobal: string;
  proyecto: {
    id: string;
    nombre: string;
  } | null;
  responsableActual: {
    userId: string;
    fullName: string;
  } | null;
  etapasResumen: Array<{
    id: string;
    tipoEtapa: string;
    estadoEtapa: string;
    dueAt: string | null;
  }>;
  bloqueos: {
    hasBlockingAlerts: boolean;
    hasBlockingNc: boolean;
    count: number;
  };
  canAdvance: boolean;
  updatedAt: string;
};

type WorkflowDetail = {
  expedienteId: string;
  codigoInterno: string;
  estadoGlobal: string;
  etapas: Array<{
    id: string;
    tipoEtapa: string;
    estadoEtapa: string;
    responsableUserId: string | null;
    responsableNombre: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    dueAt: string | null;
  }>;
  blockingReasons: Array<{
    type: "ALERTA" | "NC";
    id: string;
    code?: string | null;
    severity: string;
    title: string;
    description: string;
  }>;
  hasBlockingAlerts: boolean;
  hasBlockingNc: boolean;
  canAdvance: boolean;
};

type HistoryDetail = {
  expedienteId: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: Array<{
    id: string;
    scope: "GLOBAL" | "ETAPA";
    createdAt: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    comentario: string | null;
    changedBy: {
      userId: string;
      fullName: string;
    } | null;
    etapa: {
      id: string;
      tipoEtapa: string;
    } | null;
  }>;
};

type ExpedienteInboxItem = {
  expedienteId: string;
  loading: boolean;
  summary: ExpedienteSummary | null;
  error: string | null;
};

type DashboardData = {
  snapshot: MetricsSnapshot;
  alerts: AlertsStatus;
  history24h: MetricsHistory;
  history7d: MetricsHistory;
};

type AuthProfile = "QA" | "PROD";

type ExpedienteListResponse = {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  items: ExpedienteSummary[];
};

const INTERNAL_API_BASE_URL =
  (import.meta.env.VITE_INTERNAL_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:4000/api/v1/internal";

const OPERATIONAL_API_BASE_URL =
  (import.meta.env.VITE_OPERATIONAL_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:4000/api/v1";

const DEFAULT_AUTH_PROFILE: AuthProfile =
  (import.meta.env.PROD
    ? "PROD"
    : ((import.meta.env.VITE_AUTH_PROFILE_DEFAULT as string | undefined)?.trim().toUpperCase() ??
        "QA")) === "PROD"
    ? "PROD"
    : "QA";

const safeReadStoredToken = (): string => {
  try {
    return localStorage.getItem("pac.metrics.token")?.trim() || "";
  } catch {
    return "";
  }
};

const safeStoreToken = (token: string): void => {
  try {
    localStorage.setItem("pac.metrics.token", token);
  } catch {
    // noop
  }
};

const safeReadStoredAccessToken = (): string => {
  try {
    return localStorage.getItem("pac.auth.accessToken")?.trim() || "";
  } catch {
    return "";
  }
};

const safeStoreAccessToken = (token: string): void => {
  try {
    localStorage.setItem("pac.auth.accessToken", token);
  } catch {
    // noop
  }
};

const safeReadStoredRefreshToken = (): string => {
  try {
    return localStorage.getItem("pac.auth.refreshToken")?.trim() || "";
  } catch {
    return "";
  }
};

const safeStoreRefreshToken = (token: string): void => {
  try {
    localStorage.setItem("pac.auth.refreshToken", token);
  } catch {
    // noop
  }
};

const decodeJwtExpMs = (token: string): number | null => {
  const normalized = token.trim();
  if (!normalized) return null;
  const segments = normalized.split(".");
  if (segments.length < 2) return null;

  try {
    const payload = JSON.parse(atob(segments[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

const parseExpedienteIds = (raw: string): string[] =>
  [...new Set(raw.split(",").map((item) => item.trim()).filter((item) => item.length > 0))];

const formatValue = (metricKey: string, value: number): string => {
  if (metricKey.includes("rate")) return `${(value * 100).toFixed(2)}%`;
  if (metricKey.includes("latency")) return `${value.toFixed(2)} ms`;
  return String(value);
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const toChartPoints = (
  values: number[],
  width: number,
  height: number,
  padding: number
): string => {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const y = height / 2;
    return `${padding},${y} ${width - padding},${y}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const denominator = Math.max(max - min, 0.000001);

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * usableWidth;
      const normalized = (value - min) / denominator;
      const y = height - padding - normalized * usableHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

type TrendChartProps = {
  title: string;
  colorClassName: string;
  points: Array<{ at: string; value: number }>;
};

const TrendChart = ({ title, colorClassName, points }: TrendChartProps) => {
  const values = points.map((item) => item.value);
  const polyline = toChartPoints(values, 460, 160, 12);
  const current = values.length > 0 ? (values[values.length - 1] ?? 0) : 0;
  const firstAt = points.length > 0 ? points[0]?.at ?? null : null;
  const lastAt = points.length > 0 ? points[points.length - 1]?.at ?? null : null;

  return (
    <section className="chart-card">
      <header className="chart-header">
        <h4>{title}</h4>
        <strong>{current.toFixed(2)}</strong>
      </header>
      <svg className={`trend-svg ${colorClassName}`} viewBox="0 0 460 160" role="img" aria-label={title}>
        <polyline points={polyline} />
      </svg>
      <footer className="chart-footer">
        <span>{firstAt ? new Date(firstAt).toLocaleString() : "-"}</span>
        <span>{lastAt ? new Date(lastAt).toLocaleString() : "-"}</span>
      </footer>
    </section>
  );
};

const fetchJson = async <T,>(path: string, metricsToken: string): Promise<T> => {
  const headers: Record<string, string> = {};
  if (metricsToken.trim().length > 0) {
    headers["x-metrics-token"] = metricsToken.trim();
  }

  const response = await fetch(`${INTERNAL_API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${path}: ${text}`);
  }
  return (await response.json()) as T;
};

const parseApiError = async (
  response: Response
): Promise<{ status: number; code?: string; message: string; details?: ApiErrorPayload["details"] }> => {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload.code || payload.message) {
      return {
        status: response.status,
        code: payload.code,
        message: payload.message ?? "Error en API.",
        details: payload.details
      };
    }
  } catch {
    // noop
  }
  return {
    status: response.status,
    message: `HTTP ${response.status}`
  };
};

const toActionableApiError = (
  error: { status: number; code?: string; message: string; details?: ApiErrorPayload["details"] },
  context: ErrorUxContext
): string => {
  const code = error.code ?? "ERROR";

  if (code === "NOT_FOUND" || error.status === 404) {
    if (context === "action.reopen_stage") {
      return "NOT_FOUND: La etapa indicada no existe en este expediente. Revise la tabla de workflow y use una etapa valida.";
    }
    return "NOT_FOUND: Expediente no encontrado. Verifique que el ID exista y este activo.";
  }

  if (code === "CONFLICT" || error.status === 409) {
    if (context === "action.change_state") {
      return "CONFLICT: Transicion de estado invalida. Revise estado actual y secuencia permitida del workflow.";
    }
    if (context === "action.reopen_stage") {
      return "CONFLICT: La etapa no puede reabrirse desde su estado actual. Use una etapa en estado CERRADA, OBSERVADA, BLOQUEADA, VENCIDA o RECHAZADA.";
    }
    return "CONFLICT: Operacion rechazada por reglas de negocio.";
  }

  if (code === "UNPROCESSABLE_ENTITY" || error.status === 422) {
    const reasons = error.details?.blockingReasons ?? [];
    const detailText =
      reasons.length > 0
        ? ` Bloqueos: ${reasons.map((item) => `${item.type}:${item.title}`).join(" | ")}.`
        : "";
    return `UNPROCESSABLE_ENTITY: Precondiciones no cumplidas. Revise bloqueos activos (alertas/NC) antes de reintentar.${detailText}`;
  }

  if (code === "FORBIDDEN" || error.status === 403) {
    return "FORBIDDEN: No autorizado. Verifique permisos del rol para esta accion.";
  }

  if (code === "UNAUTHENTICATED" || error.status === 401) {
    return "UNAUTHENTICATED: Token invalido o expirado. Genere un nuevo access token y recargue bandeja.";
  }

  if (code === "INVALID_PAYLOAD" || error.status === 400) {
    return "INVALID_PAYLOAD: Datos de entrada invalidos. Revise campos obligatorios y formato.";
  }

  return `${code}: ${error.message}`;
};

function App() {
  const [token, setToken] = useState<string>(safeReadStoredToken());
  const [accessToken, setAccessToken] = useState<string>(safeReadStoredAccessToken());
  const [refreshToken, setRefreshToken] = useState<string>(safeReadStoredRefreshToken());
  const [authProfile, setAuthProfile] = useState<AuthProfile>(DEFAULT_AUTH_PROFILE);
  const [authEmail, setAuthEmail] = useState<string>(
    DEFAULT_AUTH_PROFILE === "QA" ? "admin@pac.local" : ""
  );
  const [authPassword, setAuthPassword] = useState<string>(
    DEFAULT_AUTH_PROFILE === "QA" ? "ChangeMe_123!" : ""
  );
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(
    decodeJwtExpMs(safeReadStoredAccessToken())
  );
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [windowMode, setWindowMode] = useState<"24h" | "7d">("24h");

  const [operator, setOperator] = useState<string>("ops:web-dashboard");
  const [selectedRuleId, setSelectedRuleId] = useState<string>("error_rate_24h");
  const [ackComment, setAckComment] = useState<string>("Acknowledge operativo desde dashboard");
  const [silenceReason, setSilenceReason] = useState<string>("Ventana de mantenimiento");
  const [silencedUntil, setSilencedUntil] = useState<string>("");
  const [unsilenceReason, setUnsilenceReason] = useState<string>("Fin de mantenimiento");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [timelineRuleFilter, setTimelineRuleFilter] = useState<string>("all");
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const [timelinePageSize] = useState<number>(20);
  const [actionsTimeline, setActionsTimeline] = useState<PaginatedResponse<AlertActionItem> | null>(null);
  const [eventsTimeline, setEventsTimeline] = useState<PaginatedResponse<AlertEventItem> | null>(null);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [inboxMode, setInboxMode] = useState<"filtros" | "ids">("filtros");
  const [expedientesInput, setExpedientesInput] = useState<string>(
    "35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431, b84fb315-bf65-40d4-86ff-6e4a52149965, 0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8"
  );
  const [inboxQuery, setInboxQuery] = useState<string>("");
  const [inboxEstadoGlobal, setInboxEstadoGlobal] = useState<string>("");
  const [inboxResponsableUserId, setInboxResponsableUserId] = useState<string>("");
  const [inboxPage, setInboxPage] = useState<number>(1);
  const [inboxPageSize, setInboxPageSize] = useState<number>(20);
  const [expedienteInbox, setExpedienteInbox] = useState<ExpedienteInboxItem[]>([]);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string>("");
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ExpedienteSummary | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDetail | null>(null);
  const [selectedStateHistory, setSelectedStateHistory] = useState<HistoryDetail | null>(null);
  const [historyScope, setHistoryScope] = useState<"all" | "global" | "stage">("all");
  const [changeStateTarget, setChangeStateTarget] = useState<string>("APROBADO");
  const [changeStateComment, setChangeStateComment] = useState<string>("Cambio operativo desde UI M4-B1");
  const [reopenStageTarget, setReopenStageTarget] = useState<string>("REVISION_TECNICA");
  const [reopenStageReason, setReopenStageReason] = useState<string>("Reapertura operativa desde UI M4-B1");
  const [operationalActionLoading, setOperationalActionLoading] = useState<boolean>(false);
  const [operationalFeedback, setOperationalFeedback] = useState<string | null>(null);

  const buildTimelineQuery = (): string => {
    const params = new URLSearchParams();
    params.set("page", String(timelinePage));
    params.set("pageSize", String(timelinePageSize));
    if (timelineRuleFilter !== "all") {
      params.set("ruleId", timelineRuleFilter);
    }
    return params.toString();
  };

  const setSessionTokens = (nextAccessToken: string, nextRefreshToken: string): void => {
    const normalizedAccessToken = nextAccessToken.trim();
    const normalizedRefreshToken = nextRefreshToken.trim();
    setAccessToken(normalizedAccessToken);
    setRefreshToken(normalizedRefreshToken);
    setAccessTokenExpiresAt(decodeJwtExpMs(normalizedAccessToken));
    safeStoreAccessToken(normalizedAccessToken);
    safeStoreRefreshToken(normalizedRefreshToken);
  };

  const refreshOperationalSession = async (): Promise<string> => {
    const currentRefreshToken = refreshToken.trim();
    if (!currentRefreshToken) {
      throw new Error("UNAUTHENTICATED: No hay refresh token disponible. Inicie sesion nuevamente.");
    }

    const response = await fetch(`${OPERATIONAL_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken
      })
    });

    if (!response.ok) {
      throw new Error(toActionableApiError(await parseApiError(response), "default"));
    }

    const payload = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const nextAccessToken = payload.accessToken?.trim() ?? "";
    const nextRefreshToken = payload.refreshToken?.trim() ?? "";
    if (!nextAccessToken || !nextRefreshToken) {
      throw new Error("UNAUTHENTICATED: Refresh sin tokens validos.");
    }

    setSessionTokens(nextAccessToken, nextRefreshToken);
    setAuthFeedback("Sesion renovada automaticamente.");
    return nextAccessToken;
  };

  const fetchOperationalJsonWithAuth = async <T,>(
    path: string,
    context: ErrorUxContext = "default",
    options: RequestInit = {}
  ): Promise<T> => {
    const initialToken = accessToken.trim();
    if (!initialToken) {
      throw new Error("UNAUTHENTICATED: Debe iniciar sesion para operar expedientes.");
    }

    const requestWithToken = async (bearerToken: string): Promise<Response> =>
      fetch(`${OPERATIONAL_API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${bearerToken}`,
          ...(options.body ? { "Content-Type": "application/json" } : {})
        }
      });

    let response = await requestWithToken(initialToken);

    if (response.status === 401) {
      const renewedToken = await refreshOperationalSession();
      response = await requestWithToken(renewedToken);
    }

    if (!response.ok) {
      throw new Error(toActionableApiError(await parseApiError(response), context));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  };

  const loadTimeline = async (metricsToken: string): Promise<void> => {
    setTimelineLoading(true);
    setTimelineError(null);
    const query = buildTimelineQuery();

    try {
      const [actions, events] = await Promise.all([
        fetchJson<PaginatedResponse<AlertActionItem>>(`/alerts/operational/actions?${query}`, metricsToken),
        fetchJson<PaginatedResponse<AlertEventItem>>(`/alerts/operational/events?${query}`, metricsToken)
      ]);
      setActionsTimeline(actions);
      setEventsTimeline(events);
      setTimelineLoading(false);
    } catch (timelineLoadError) {
      setTimelineLoading(false);
      setTimelineError(
        timelineLoadError instanceof Error
          ? timelineLoadError.message
          : "Error cargando historial operativo."
      );
    }
  };

  const loadDashboard = async (metricsToken: string): Promise<void> => {
    setLoading(true);
    setError(null);
    safeStoreToken(metricsToken);

    try {
      const [snapshot, alerts, history24h, history7d] = await Promise.all([
        fetchJson<MetricsSnapshot>("/metrics", metricsToken),
        fetchJson<AlertsStatus>("/alerts/operational", metricsToken),
        fetchJson<MetricsHistory>("/metrics/history?window=24h", metricsToken),
        fetchJson<MetricsHistory>("/metrics/history?window=7d", metricsToken)
      ]);

      startTransition(() => {
        setData({ snapshot, alerts, history24h, history7d });
        setLoading(false);
      });
      await loadTimeline(metricsToken);
    } catch (loadError) {
      setLoading(false);
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Error desconocido cargando dashboard.");
    }
  };

  const loadExpedienteDetail = async (
    expedienteId: string,
    scope: "all" | "global" | "stage" = historyScope
  ): Promise<void> => {
    setDetailLoading(true);
    setDetailError(null);
    setOperationalFeedback(null);

    try {
      const [summary, workflow, history] = await Promise.all([
        fetchOperationalJsonWithAuth<ExpedienteSummary>(
          `/expedientes/${encodeURIComponent(expedienteId)}`,
          "detail.summary"
        ),
        fetchOperationalJsonWithAuth<WorkflowDetail>(
          `/expedientes/${encodeURIComponent(expedienteId)}/workflow`,
          "detail.workflow"
        ),
        fetchOperationalJsonWithAuth<HistoryDetail>(
          `/expedientes/${encodeURIComponent(expedienteId)}/history?page=1&pageSize=20&scope=${scope}`,
          "detail.history"
        )
      ]);

      setSelectedSummary(summary);
      setSelectedWorkflow(workflow);
      setSelectedStateHistory(history);
      setSelectedExpedienteId(expedienteId);
      setDetailLoading(false);
    } catch (detailLoadError) {
      setDetailLoading(false);
      setSelectedSummary(null);
      setSelectedWorkflow(null);
      setSelectedStateHistory(null);
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : "Error cargando detalle.");
    }
  };

  const loadExpedienteInboxByIds = async (rawIds: string): Promise<void> => {
    const ids = parseExpedienteIds(rawIds);
    if (ids.length === 0) {
      setExpedienteInbox([]);
      setSelectedExpedienteId("");
      setSelectedSummary(null);
      setSelectedWorkflow(null);
      setSelectedStateHistory(null);
      setDetailError("Debe ingresar al menos un ID de expediente.");
      return;
    }

    setDetailError(null);
    setExpedienteInbox(ids.map((id) => ({ expedienteId: id, loading: true, summary: null, error: null })));

    const resolved = await Promise.all(
      ids.map(async (id): Promise<ExpedienteInboxItem> => {
        try {
          const summary = await fetchOperationalJsonWithAuth<ExpedienteSummary>(
            `/expedientes/${encodeURIComponent(id)}`,
            "inbox"
          );
          return {
            expedienteId: id,
            loading: false,
            summary,
            error: null
          };
        } catch (inboxError) {
          return {
            expedienteId: id,
            loading: false,
            summary: null,
            error: inboxError instanceof Error ? inboxError.message : "Error cargando expediente."
          };
        }
      })
    );

    setExpedienteInbox(resolved);
    const firstValid = resolved.find((item) => item.summary !== null);
    if (firstValid?.summary) {
      await loadExpedienteDetail(firstValid.expedienteId, historyScope);
    } else {
      setSelectedExpedienteId("");
      setSelectedSummary(null);
      setSelectedWorkflow(null);
      setSelectedStateHistory(null);
    }
  };

  const loadExpedienteInboxByFilters = async (): Promise<void> => {
    setDetailError(null);
    try {
      const query = new URLSearchParams({
        page: String(inboxPage),
        pageSize: String(inboxPageSize)
      });
      if (inboxQuery.trim().length > 0) query.set("q", inboxQuery.trim());
      if (inboxEstadoGlobal.trim().length > 0) query.set("estadoGlobal", inboxEstadoGlobal.trim());
      if (inboxResponsableUserId.trim().length > 0) {
        query.set("responsableUserId", inboxResponsableUserId.trim());
      }

      const list = await fetchOperationalJsonWithAuth<ExpedienteListResponse>(
        `/expedientes?${query.toString()}`,
        "inbox"
      );

      const items = list.items.map((summary) => ({
        expedienteId: summary.expedienteId,
        loading: false,
        summary,
        error: null
      }));

      setExpedienteInbox(items);
      const firstValid = items.find((item) => item.summary !== null);
      if (firstValid?.summary) {
        await loadExpedienteDetail(firstValid.expedienteId, historyScope);
      } else {
        setSelectedExpedienteId("");
        setSelectedSummary(null);
        setSelectedWorkflow(null);
        setSelectedStateHistory(null);
      }
    } catch (inboxError) {
      setExpedienteInbox([]);
      setSelectedExpedienteId("");
      setSelectedSummary(null);
      setSelectedWorkflow(null);
      setSelectedStateHistory(null);
      setDetailError(inboxError instanceof Error ? inboxError.message : "Error cargando bandeja operativa.");
    }
  };

  const loadExpedienteInbox = async (): Promise<void> => {
    if (inboxMode === "ids") {
      await loadExpedienteInboxByIds(expedientesInput);
      return;
    }
    await loadExpedienteInboxByFilters();
  };

  const loginOperationalUser = async (): Promise<void> => {
    setAuthLoading(true);
    setAuthFeedback(null);

    try {
      const normalizedEmail = authEmail.trim();
      if (authProfile === "PROD" && (!normalizedEmail || !authPassword.trim())) {
        throw new Error("INVALID_PAYLOAD: En perfil PROD debe ingresar credenciales explicitas.");
      }
      if (authProfile === "PROD" && normalizedEmail.toLowerCase() === "admin@pac.local") {
        throw new Error(
          "INVALID_PAYLOAD: Perfil PROD bloquea credenciales de validacion local. Use usuario productivo."
        );
      }

      const response = await fetch(`${OPERATIONAL_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: authPassword
        })
      });

      if (!response.ok) {
        throw new Error(toActionableApiError(await parseApiError(response), "default"));
      }

      const payload = (await response.json()) as LoginResponse;
      const nextAccessToken = payload.tokens.accessToken?.trim() ?? "";
      const nextRefreshToken = payload.tokens.refreshToken?.trim() ?? "";
      if (!nextAccessToken || !nextRefreshToken) {
        throw new Error("UNAUTHENTICATED: Login sin access token.");
      }

      setSessionTokens(nextAccessToken, nextRefreshToken);
      setAuthFeedback("Sesion operativa iniciada. Token cargado automaticamente.");
      setAuthLoading(false);
    } catch (loginError) {
      setAuthLoading(false);
      setAuthFeedback(loginError instanceof Error ? loginError.message : "Error autenticando usuario.");
    }
  };

  const runOperationalAction = async (
    path: string,
    body: Record<string, unknown>,
    successMessage: string,
    context: ErrorUxContext
  ): Promise<void> => {
    if (!selectedExpedienteId) {
      setOperationalFeedback("Seleccione un expediente antes de ejecutar acciones.");
      return;
    }

    setOperationalActionLoading(true);
    setOperationalFeedback(null);

    try {
      const response = await fetch(`${OPERATIONAL_API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      let finalResponse = response;
      if (response.status === 401) {
        const renewedToken = await refreshOperationalSession();
        finalResponse = await fetch(`${OPERATIONAL_API_BASE_URL}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${renewedToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
      }

      if (!finalResponse.ok) {
        throw new Error(toActionableApiError(await parseApiError(finalResponse), context));
      }

      setOperationalFeedback(successMessage);
      await loadExpedienteInbox();
      await loadExpedienteDetail(selectedExpedienteId, historyScope);
      setOperationalActionLoading(false);
    } catch (actionError) {
      setOperationalActionLoading(false);
      setOperationalFeedback(actionError instanceof Error ? actionError.message : "Error ejecutando accion.");
    }
  };

  useEffect(() => {
    void loadDashboard(token);
  }, []);

  useEffect(() => {
    if (!data) return;
    void loadTimeline(token);
  }, [timelinePage, timelineRuleFilter]);

  useEffect(() => {
    if (silencedUntil) return;
    const defaultValue = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);
    setSilencedUntil(defaultValue);
  }, [silencedUntil]);

  useEffect(() => {
    if (!selectedExpedienteId || !accessToken.trim()) return;
    void loadExpedienteDetail(selectedExpedienteId, historyScope);
  }, [historyScope]);

  useEffect(() => {
    safeStoreAccessToken(accessToken);
    setAccessTokenExpiresAt(decodeJwtExpMs(accessToken));
  }, [accessToken]);

  useEffect(() => {
    safeStoreRefreshToken(refreshToken);
  }, [refreshToken]);

  useEffect(() => {
    if (authProfile === "PROD") {
      if (authEmail.trim().toLowerCase() === "admin@pac.local") setAuthEmail("");
      if (authPassword === "ChangeMe_123!") setAuthPassword("");
      return;
    }

    if (!authEmail.trim()) setAuthEmail("admin@pac.local");
    if (!authPassword.trim()) setAuthPassword("ChangeMe_123!");
  }, [authProfile]);

  useEffect(() => {
    if (uniqueReopenableStageOptions.length === 0) {
      setReopenStageTarget("");
      return;
    }
    if (!uniqueReopenableStageOptions.includes(reopenStageTarget)) {
      setReopenStageTarget(uniqueReopenableStageOptions[0] ?? "");
    }
  }, [selectedWorkflow]);

  useEffect(() => {
    if (!accessToken.trim()) return;
    if (!accessTokenExpiresAt) return;

    const minutesLeft = Math.floor((accessTokenExpiresAt - Date.now()) / 60000);
    if (minutesLeft > 2) return;

    void refreshOperationalSession();
  }, [accessTokenExpiresAt, accessToken, refreshToken]);

  const postAction = async (path: string, body: Record<string, unknown>, successMessage: string) => {
    setActionLoading(true);
    setActionFeedback(null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token.trim().length > 0) {
      headers["x-metrics-token"] = token.trim();
    }

    try {
      const response = await fetch(`${INTERNAL_API_BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      setActionFeedback(successMessage);
      await loadDashboard(token);
      await loadTimeline(token);
      setActionLoading(false);
    } catch (postError) {
      setActionLoading(false);
      setActionFeedback(postError instanceof Error ? postError.message : "Error ejecutando accion operativa.");
    }
  };

  const selectedTrendHistory = windowMode === "24h" ? data?.history24h : data?.history7d;
  const timelineTotalPages = Math.max(actionsTimeline?.totalPages ?? 1, eventsTimeline?.totalPages ?? 1);
  const reopenableStageOptions = (selectedWorkflow?.etapas ?? [])
    .filter((stage) =>
      ["CERRADA", "RECHAZADA", "VENCIDA", "BLOQUEADA", "OBSERVADA"].includes(stage.estadoEtapa)
    )
    .map((stage) => stage.tipoEtapa);
  const uniqueReopenableStageOptions = [...new Set(reopenableStageOptions)];
  const tokenMinutesLeft =
    accessTokenExpiresAt && Number.isFinite(accessTokenExpiresAt)
      ? Math.max(0, Math.floor((accessTokenExpiresAt - Date.now()) / 60000))
      : null;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <div>
          <h1>Dashboard Operativo M3-E5</h1>
          <p>
            Estado de alertas automaticas, acciones operativas y tendencias historicas para <code>error_rate</code>,{" "}
            <code>p95_latency</code> y <code>5xx_count</code>.
          </p>
        </div>

        <form
          className="token-form"
          onSubmit={(event) => {
            event.preventDefault();
            void loadDashboard(token);
          }}
        >
          <label htmlFor="metrics-token">x-metrics-token</label>
          <input
            id="metrics-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="(opcional) token interno"
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </form>
      </section>

      {error ? <section className="error-panel">{error}</section> : null}

      <section className="status-grid">
        <article className="status-card">
          <h3>Salud Operacional</h3>
          <p className={data?.snapshot.summary.isHealthy ? "ok-text" : "error-text"}>
            {data?.snapshot.summary.isHealthy ? "SANO" : "DEGRADADO"}
          </p>
          <small>
            Failing metrics:{" "}
            {data?.snapshot.summary.failingMetrics.length
              ? data.snapshot.summary.failingMetrics.join(", ")
              : "ninguna"}
          </small>
        </article>

        <article className="status-card">
          <h3>Evaluador de Alertas</h3>
          <p
            className={
              data?.alerts.lastEvaluationStatus === "ok" ? "ok-text" : "warning-text"
            }
          >
            {data?.alerts.lastEvaluationStatus?.toUpperCase() ?? "-"}
          </p>
          <small>{data?.alerts.lastEvaluationMessage ?? "Sin datos"}</small>
        </article>

        <article className="status-card">
          <h3>Reglas Activas</h3>
          <p>{data?.alerts.rules.filter((rule) => rule.state.isActive).length ?? 0}</p>
          <small>Total reglas: {data?.alerts.rules.length ?? 0}</small>
        </article>
      </section>

      <section className="metrics-table-card">
        <h3>Snapshot de Metricas</h3>
        <table>
          <thead>
            <tr>
              <th>Metrica</th>
              <th>Valor</th>
              <th>Umbral</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data
              ? Object.entries(data.snapshot.metrics).map(([key, metric]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{formatValue(key, metric.value)}</td>
                    <td>
                      {metric.comparator} {metric.threshold} {metric.unit}
                    </td>
                    <td className={metric.isWithinThreshold ? "ok-text" : "error-text"}>
                      {metric.isWithinThreshold ? "OK" : "BREACH"}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>

      <section className="actions-card">
        <h3>Acciones Operativas de Alertas (M3-E5)</h3>
        <div className="actions-grid">
          <label>
            Regla
            <select
              value={selectedRuleId}
              onChange={(event) => setSelectedRuleId(event.target.value)}
              disabled={actionLoading}
            >
              {(data?.alerts.rules ?? []).map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Operador
            <input
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              placeholder="ops:web-dashboard"
              disabled={actionLoading}
            />
          </label>
        </div>

        <div className="actions-row">
          <label>
            Comment (acknowledge)
            <input
              value={ackComment}
              onChange={(event) => setAckComment(event.target.value)}
              placeholder="Acknowledge manual"
              disabled={actionLoading}
            />
          </label>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              void postAction(
                `/alerts/operational/${selectedRuleId}/acknowledge`,
                { comment: ackComment, operator },
                `Acknowledge ejecutado para ${selectedRuleId}.`
              )
            }
          >
            {actionLoading ? "Ejecutando..." : "Acknowledge"}
          </button>
        </div>

        <div className="actions-row">
          <label>
            Reason (silence)
            <input
              value={silenceReason}
              onChange={(event) => setSilenceReason(event.target.value)}
              placeholder="Ventana de mantenimiento"
              disabled={actionLoading}
            />
          </label>
          <label>
            Silenced until (UTC)
            <input
              type="datetime-local"
              value={silencedUntil}
              onChange={(event) => setSilencedUntil(event.target.value)}
              disabled={actionLoading}
            />
          </label>
          <button
            type="button"
            disabled={actionLoading || !silencedUntil}
            onClick={() =>
              void postAction(
                `/alerts/operational/${selectedRuleId}/silence`,
                {
                  reason: silenceReason,
                  silencedUntil: new Date(silencedUntil).toISOString(),
                  operator
                },
                `Silence ejecutado para ${selectedRuleId}.`
              )
            }
          >
            {actionLoading ? "Ejecutando..." : "Silence"}
          </button>
        </div>

        <div className="actions-row">
          <label>
            Reason (unsilence)
            <input
              value={unsilenceReason}
              onChange={(event) => setUnsilenceReason(event.target.value)}
              placeholder="Fin de mantenimiento"
              disabled={actionLoading}
            />
          </label>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              void postAction(
                `/alerts/operational/${selectedRuleId}/unsilence`,
                { reason: unsilenceReason, operator },
                `Unsilence ejecutado para ${selectedRuleId}.`
              )
            }
          >
            {actionLoading ? "Ejecutando..." : "Unsilence"}
          </button>
        </div>

        {actionFeedback ? <p className="action-feedback">{actionFeedback}</p> : null}
      </section>

      <section className="alerts-card">
        <h3>Estado de Reglas de Alerta</h3>
        <div className="alerts-grid">
          {data?.alerts.rules.map((rule) => (
            <article key={rule.id} className="alert-rule-card">
              <header>
                <strong>{rule.id}</strong>
                <span className={rule.state.isActive ? "pill-critical" : "pill-ok"}>
                  {rule.state.isActive ? "ACTIVA" : "RESUELTA"}
                </span>
              </header>
              <p>{rule.message}</p>
              <small>
                metrica={rule.metric} | severidad={rule.severity} | umbral={rule.threshold}
              </small>
              <small>ultimo valor={rule.state.lastValue.toFixed(4)}</small>
              <small>
                silenciada={rule.state.isSilenced ? "si" : "no"} | hasta{" "}
                {formatDateTime(rule.state.silencedUntil ?? null)}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="timeline-card">
        <header className="timeline-header">
          <h3>Timeline Operativo de Alertas</h3>
          <div className="timeline-controls">
            <select
              value={timelineRuleFilter}
              onChange={(event) => {
                setTimelinePage(1);
                setTimelineRuleFilter(event.target.value);
              }}
            >
              <option value="all">Todas las reglas</option>
              {(data?.alerts.rules ?? []).map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadTimeline(token)}
              disabled={timelineLoading}
            >
              {timelineLoading ? "Cargando..." : "Refrescar timeline"}
            </button>
          </div>
        </header>

        {timelineError ? <section className="error-panel">{timelineError}</section> : null}

        <div className="timeline-tables">
          <section className="timeline-table-wrap">
            <h4>Acciones</h4>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Regla</th>
                  <th>Tipo</th>
                  <th>Operador</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {(actionsTimeline?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>{item.ruleId}</td>
                    <td>{item.actionType}</td>
                    <td>{item.operator ?? "-"}</td>
                    <td>{item.comment ?? item.silencedUntil ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="timeline-table-wrap">
            <h4>Eventos</h4>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Regla</th>
                  <th>Evento</th>
                  <th>Severidad</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {(eventsTimeline?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>{item.ruleId}</td>
                    <td>{item.eventType}</td>
                    <td>{item.severity}</td>
                    <td>{item.value ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <footer className="timeline-pagination">
          <button
            type="button"
            disabled={timelinePage <= 1 || timelineLoading}
            onClick={() => setTimelinePage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <span>
            Pagina {timelinePage} / {timelineTotalPages}
          </span>
          <button
            type="button"
            disabled={timelineLoading || timelinePage >= timelineTotalPages}
            onClick={() => setTimelinePage((current) => current + 1)}
          >
            Siguiente
          </button>
        </footer>
      </section>

      <section className="expedientes-shell">
        <header className="expedientes-header">
          <div>
            <h3>M4-B1 · UI Operativa Expedientes (F2-F5)</h3>
            <p>Bandeja/listado por IDs y detalle operativo con acciones de workflow.</p>
          </div>
          <form
            className="expedientes-auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void loadExpedienteInbox();
            }}
          >
            <label htmlFor="auth-profile">Perfil operativo</label>
            <select
              id="auth-profile"
              value={authProfile}
              onChange={(event) => setAuthProfile(event.target.value as AuthProfile)}
            >
              <option value="QA">QA</option>
              <option value="PROD">PROD</option>
            </select>
            <label htmlFor="auth-email">Email operativo</label>
            <input
              id="auth-email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder={authProfile === "QA" ? "admin@pac.local" : "usuario@empresa.com"}
              autoComplete="username"
            />
            <label htmlFor="auth-password">Password operativo</label>
            <input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder={authProfile === "QA" ? "password QA" : "password PROD"}
              autoComplete="current-password"
            />
            <button
              type="button"
              disabled={authLoading}
              onClick={() => {
                void loginOperationalUser();
              }}
            >
              {authLoading ? "Autenticando..." : "Iniciar sesion y cargar token"}
            </button>
            <label htmlFor="access-token">Access token (Bearer)</label>
            <input
              id="access-token"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="pegar access token JWT"
              autoComplete="off"
            />
            <label htmlFor="inbox-mode">Modo de bandeja</label>
            <select
              id="inbox-mode"
              value={inboxMode}
              onChange={(event) => setInboxMode(event.target.value as "filtros" | "ids")}
            >
              <option value="filtros">Filtros operativos</option>
              <option value="ids">IDs manuales</option>
            </select>
            {inboxMode === "filtros" ? (
              <>
                <label htmlFor="inbox-query">Filtro q (codigo/id/proyecto)</label>
                <input
                  id="inbox-query"
                  value={inboxQuery}
                  onChange={(event) => setInboxQuery(event.target.value)}
                  placeholder="PAC-VERIF-001"
                />
                <label htmlFor="inbox-estado">estadoGlobal</label>
                <input
                  id="inbox-estado"
                  value={inboxEstadoGlobal}
                  onChange={(event) => setInboxEstadoGlobal(event.target.value)}
                  placeholder="CONTROL"
                />
                <label htmlFor="inbox-responsable">responsableUserId</label>
                <input
                  id="inbox-responsable"
                  value={inboxResponsableUserId}
                  onChange={(event) => setInboxResponsableUserId(event.target.value)}
                  placeholder="(opcional) UUID responsable"
                />
                <label htmlFor="inbox-page">page</label>
                <input
                  id="inbox-page"
                  type="number"
                  min={1}
                  value={inboxPage}
                  onChange={(event) => setInboxPage(Number(event.target.value) || 1)}
                />
                <label htmlFor="inbox-page-size">pageSize</label>
                <input
                  id="inbox-page-size"
                  type="number"
                  min={1}
                  max={100}
                  value={inboxPageSize}
                  onChange={(event) => setInboxPageSize(Number(event.target.value) || 20)}
                />
              </>
            ) : (
              <>
                <label htmlFor="expedientes-ids">Bandeja (IDs separados por coma)</label>
                <input
                  id="expedientes-ids"
                  value={expedientesInput}
                  onChange={(event) => setExpedientesInput(event.target.value)}
                  placeholder="EXP-001, EXP-002, EXP-003"
                />
              </>
            )}
            <button type="submit" disabled={detailLoading}>
              {detailLoading ? "Cargando..." : "Cargar bandeja"}
            </button>
            {tokenMinutesLeft !== null ? (
              <p className="session-status">
                Sesion: expira en {tokenMinutesLeft} min {tokenMinutesLeft <= 2 ? "(renovacion activa)" : ""}
              </p>
            ) : null}
            {authFeedback ? <p className="action-feedback">{authFeedback}</p> : null}
          </form>
        </header>

        <section className="expedientes-grid">
          <article className="expedientes-panel">
            <h4>Bandeja / Listado</h4>
            <table>
              <thead>
                <tr>
                  <th>Expediente</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Bloqueos</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {expedienteInbox.map((item) => (
                  <tr key={item.expedienteId}>
                    <td>{item.expedienteId}</td>
                    <td>{item.summary?.estadoGlobal ?? (item.loading ? "Cargando..." : "Sin dato")}</td>
                    <td>{item.summary?.responsableActual?.fullName ?? "-"}</td>
                    <td>{item.summary?.bloqueos.count ?? "-"}</td>
                    <td>
                        <button
                          type="button"
                          disabled={item.loading || !item.summary}
                          onClick={() => void loadExpedienteDetail(item.expedienteId)}
                        >
                          Abrir
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expedienteInbox.some((item) => item.error) ? (
              <div className="inline-errors">
                {expedienteInbox
                  .filter((item) => item.error)
                  .map((item) => (
                    <p key={`${item.expedienteId}-err`}>
                      {item.expedienteId}: {item.error}
                    </p>
                  ))}
              </div>
            ) : null}
          </article>

          <article className="expedientes-panel">
            <h4>Detalle Operativo</h4>
            {selectedExpedienteId ? (
              <p className="detail-id">Expediente seleccionado: {selectedExpedienteId}</p>
            ) : null}
            {detailError ? <section className="error-panel">{detailError}</section> : null}

            {selectedSummary ? (
              <div className="detail-cards">
                <section className="detail-card">
                  <h5>Resumen (F2)</h5>
                  <p>
                    <strong>Codigo:</strong> {selectedSummary.codigoInterno}
                  </p>
                  <p>
                    <strong>Estado:</strong> {selectedSummary.estadoGlobal}
                  </p>
                  <p>
                    <strong>Responsable:</strong> {selectedSummary.responsableActual?.fullName ?? "-"}
                  </p>
                  <p>
                    <strong>Can advance:</strong> {selectedSummary.canAdvance ? "si" : "no"}
                  </p>
                  <p>
                    <strong>Bloqueos:</strong> {selectedSummary.bloqueos.count}
                  </p>
                </section>

                <section className="detail-card">
                  <h5>Workflow (F3)</h5>
                  <table>
                    <thead>
                      <tr>
                        <th>Etapa</th>
                        <th>Estado</th>
                        <th>Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedWorkflow?.etapas ?? []).map((stage) => (
                        <tr key={stage.id}>
                          <td>{stage.tipoEtapa}</td>
                          <td>{stage.estadoEtapa}</td>
                          <td>{stage.responsableNombre ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(selectedWorkflow?.blockingReasons?.length ?? 0) > 0 ? (
                    <div className="inline-errors">
                      <p>
                        <strong>Bloqueos activos:</strong>
                      </p>
                      {selectedWorkflow?.blockingReasons.map((reason) => (
                        <p key={reason.id}>
                          [{reason.type}] {reason.title} ({reason.severity})
                        </p>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            <section className="detail-card">
              <div className="history-header">
                <h5>Historial de estados (F3)</h5>
                <select
                  value={historyScope}
                  onChange={(event) =>
                    setHistoryScope(event.target.value as "all" | "global" | "stage")
                  }
                >
                  <option value="all">all</option>
                  <option value="global">global</option>
                  <option value="stage">stage</option>
                </select>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Scope</th>
                    <th>Cambio</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedStateHistory?.items ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{entry.scope}</td>
                      <td>
                        {(entry.estadoAnterior ?? "-")} → {entry.estadoNuevo}
                      </td>
                      <td>{entry.comentario ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </article>
        </section>

        <section className="expedientes-actions">
          <h4>Acciones de Workflow (F4/F5)</h4>
          <div className="actions-split">
            <form
              className="workflow-action-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedExpedienteId) return;
                void runOperationalAction(
                  `/expedientes/${encodeURIComponent(selectedExpedienteId)}/change-state`,
                  { estadoNuevo: changeStateTarget, comentario: changeStateComment },
                  `Cambio de estado aplicado en ${selectedExpedienteId}.`,
                  "action.change_state"
                );
              }}
            >
              <h5>F4 · Change State</h5>
              <label>
                estadoNuevo
                <input
                  value={changeStateTarget}
                  onChange={(event) => setChangeStateTarget(event.target.value)}
                  placeholder="APROBADO"
                />
              </label>
              <label>
                comentario
                <input
                  value={changeStateComment}
                  onChange={(event) => setChangeStateComment(event.target.value)}
                  placeholder="Comentario operativo"
                />
              </label>
              <button type="submit" disabled={operationalActionLoading || !selectedExpedienteId}>
                {operationalActionLoading ? "Ejecutando..." : "Ejecutar change-state"}
              </button>
            </form>

            <form
              className="workflow-action-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedExpedienteId) return;
                void runOperationalAction(
                  `/expedientes/${encodeURIComponent(selectedExpedienteId)}/reopen-stage`,
                  { etapa: reopenStageTarget, motivo: reopenStageReason },
                  `Reapertura de etapa aplicada en ${selectedExpedienteId}.`,
                  "action.reopen_stage"
                );
              }}
            >
              <h5>F5 · Reopen Stage</h5>
              <label>
                etapa
                <select
                  value={reopenStageTarget}
                  onChange={(event) => setReopenStageTarget(event.target.value)}
                >
                  {uniqueReopenableStageOptions.length === 0 ? (
                    <option value="">Sin etapas reabribles</option>
                  ) : (
                    uniqueReopenableStageOptions.map((etapa) => (
                      <option key={etapa} value={etapa}>
                        {etapa}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label>
                motivo
                <input
                  value={reopenStageReason}
                  onChange={(event) => setReopenStageReason(event.target.value)}
                  placeholder="Motivo de reapertura"
                />
              </label>
              <button
                type="submit"
                disabled={
                  operationalActionLoading ||
                  !selectedExpedienteId ||
                  uniqueReopenableStageOptions.length === 0 ||
                  !reopenStageTarget
                }
              >
                {operationalActionLoading ? "Ejecutando..." : "Ejecutar reopen-stage"}
              </button>
              {uniqueReopenableStageOptions.length === 0 ? (
                <p className="session-status">
                  No hay etapas elegibles para reapertura (CERRADA|OBSERVADA|BLOQUEADA|VENCIDA|RECHAZADA).
                </p>
              ) : null}
            </form>
          </div>
          {operationalFeedback ? <p className="action-feedback">{operationalFeedback}</p> : null}
        </section>
      </section>

      <section className="trend-controls">
        <h3>Tendencias Historicas</h3>
        <div className="window-switch">
          <button
            type="button"
            className={windowMode === "24h" ? "active" : ""}
            onClick={() => setWindowMode("24h")}
          >
            Ultimas 24h
          </button>
          <button
            type="button"
            className={windowMode === "7d" ? "active" : ""}
            onClick={() => setWindowMode("7d")}
          >
            Ultimos 7d
          </button>
        </div>
      </section>

      <section className="charts-grid">
        <TrendChart
          title={`error_rate (${windowMode})`}
          colorClassName="chart-danger"
          points={(selectedTrendHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.errorRate
          }))}
        />
        <TrendChart
          title={`p95_latency (${windowMode})`}
          colorClassName="chart-warning"
          points={(selectedTrendHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.p95Latency
          }))}
        />
        <TrendChart
          title={`5xx_count (${windowMode})`}
          colorClassName="chart-accent"
          points={(selectedTrendHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.count5xx
          }))}
        />
      </section>
    </main>
  );
}

export default App;
