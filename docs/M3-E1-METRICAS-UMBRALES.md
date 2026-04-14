# M3-E1 - METRICAS MINIMAS Y UMBRALES OPERATIVOS

## Alcance

Definicion inicial de metricas operativas para control minimo del API en MVP.

Ventana de medicion actual:
- en memoria desde inicio de proceso (no persistente).

## Metricas definidas

1. `error_rate`
- formula: `requestsErrorTotal / requestsTotal`
- incluye status `>= 400`
- umbral: `<= 0.05` (5%)

2. `p95_latency`
- formula: percentil 95 de `durationMs` en respuestas HTTP completadas
- umbral: `<= 700ms`

3. `5xx_count`
- formula: conteo acumulado de respuestas `>= 500`
- umbral: `< 5` por ciclo de proceso

4. `auth_refresh_failed_rate`
- formula: `authRefreshFailures / authRefreshAttempts`
- alcance: endpoint `POST /api/v1/auth/refresh`, fallos status `>= 400`
- umbral: `<= 0.20` (20%)

5. `audit_log_failed_count`
- formula: conteo de eventos `audit.log.failed_non_blocking`
- umbral: `< 1` (objetivo operativo: cero fallas)

6. `workflow_422_rate`
- formula: `workflowChangeState422 / workflowChangeStateAttempts`
- alcance: endpoint `POST /api/v1/expedientes/:id/change-state`
- umbral: `<= 0.25` (25%)

## Endpoint interno de metricas

- `GET /api/v1/internal/metrics`
- seguridad:
  - si `METRICS_TOKEN` esta configurado, requiere header `x-metrics-token`.
  - si no esta configurado, acceso interno sin token.

Respuesta incluye:
- `counters`
- `metrics` (valor + umbral + estado por metrica)
- `summary.isHealthy`
- `summary.failingMetrics`
