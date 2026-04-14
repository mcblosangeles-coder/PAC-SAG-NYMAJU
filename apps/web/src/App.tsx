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

type DashboardData = {
  snapshot: MetricsSnapshot;
  alerts: AlertsStatus;
  history24h: MetricsHistory;
  history7d: MetricsHistory;
};

const INTERNAL_API_BASE_URL =
  (import.meta.env.VITE_INTERNAL_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:4000/api/v1/internal";

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

function App() {
  const [token, setToken] = useState<string>(safeReadStoredToken());
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

  const buildTimelineQuery = (): string => {
    const params = new URLSearchParams();
    params.set("page", String(timelinePage));
    params.set("pageSize", String(timelinePageSize));
    if (timelineRuleFilter !== "all") {
      params.set("ruleId", timelineRuleFilter);
    }
    return params.toString();
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

  const selectedHistory = windowMode === "24h" ? data?.history24h : data?.history7d;
  const timelineTotalPages = Math.max(actionsTimeline?.totalPages ?? 1, eventsTimeline?.totalPages ?? 1);

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
          points={(selectedHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.errorRate
          }))}
        />
        <TrendChart
          title={`p95_latency (${windowMode})`}
          colorClassName="chart-warning"
          points={(selectedHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.p95Latency
          }))}
        />
        <TrendChart
          title={`5xx_count (${windowMode})`}
          colorClassName="chart-accent"
          points={(selectedHistory?.points ?? []).map((item) => ({
            at: item.at,
            value: item.count5xx
          }))}
        />
      </section>
    </main>
  );
}

export default App;
