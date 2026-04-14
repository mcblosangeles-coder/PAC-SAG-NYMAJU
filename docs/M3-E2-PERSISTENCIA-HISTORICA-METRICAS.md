# M3-E2 - Persistencia historica de metricas (collector/TSDB)

## Diagnostico tecnico

El endpoint `GET /api/v1/internal/metrics` de M3-E1 expone solo estado en memoria del proceso API. Esto no permite analisis historico confiable por reinicios ni consultas de ventana (`24h/7d`).

## Decision de stack minimo

Se adopta **Postgres time-series simple** (tabla de snapshots por ventana) como stack minimo M3-E2.

Alternativa descartada para este bloque:
- Prometheus + exporter: mayor valor para observabilidad avanzada, pero agrega operacion extra (infra/retencion/rules) antes de cerrar capacidades base del MVP.

## Modelo de persistencia y retencion

1. Tabla: `operational_metric_snapshots`.
2. Granularidad: snapshot por ventana (default 60s).
3. Unicidad: `(source, window_start)`.
4. Metricas persistidas:
- contadores de trafico y errores,
- tasas derivadas (`error_rate`, `auth_refresh_failed_rate`, `workflow_422_rate`),
- `p95_latency_ms`.
5. Retencion:
- politica configurable por `METRICS_RETENTION_DAYS` (default `30`),
- purga automatica en collector por `window_end < cutoff`.

## Flujo de exportacion

1. Collector interno toma snapshot en memoria.
2. Calcula deltas de contadores respecto del ultimo snapshot persistido.
3. Persiste snapshot en Postgres por `upsert`.
4. Ejecuta purga por retencion.

Variables de control:
- `METRICS_COLLECTOR_ENABLED` (default `true`, en `test` default `false`),
- `METRICS_COLLECTOR_INTERVAL_SECONDS` (default `60`),
- `METRICS_RETENTION_DAYS` (default `30`).

## Consulta historica

Endpoint interno:
- `GET /api/v1/internal/metrics/history?window=24h|7d`

Retorna:
- serie temporal de `errorRate`, `p95Latency`, `count5xx`,
- resumen agregado por ventana (`24h` o `7d`).

## Criterio de salida M3-E2

1. Persistencia historica activa en Postgres.
2. Consulta `24h/7d` operativa.
3. Politica de retencion implementada.
4. Trazabilidad en acta de MacroFase 3.
