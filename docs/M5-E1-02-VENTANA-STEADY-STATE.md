# M5-E1-02 - Ventana Steady-State (10 min)

## Fecha
2026-04-15

## Objetivo

Validar estabilidad operativa en ventana limpia de 10 minutos con trafico funcional (solo respuestas `200`) y capturar evidencia de `metrics/alerts/history`.

## Baseline

1. Baseline de referencia: `c837dd9`.
2. Entorno: `local`.
3. API reiniciada antes de la ventana para reset de contadores de proceso.

## Ejecucion de ventana (10 min)

1. Inicio ventana UTC: `2026-04-15T18:48:04.3838762Z`
2. Fin ventana UTC: `2026-04-15T18:57:06.5049733Z`
3. Trafico aplicado por minuto:
   - `GET /api/v1/health`
   - `GET /api/v1/internal/metrics`
4. Resultado por tick (`1..10`):
   - `health_status=200`
   - `metrics_status=200`

## Evidencia capturada

### Snapshot inmediato post-ventana

1. `GET /api/v1/health`
   - `{"service":"api","status":"ok"}`
2. `GET /api/v1/internal/metrics`
   - `requestsTotal=22`
   - `requestsErrorTotal=0`
   - `requests5xxTotal=0`
   - `error_rate=0`
   - `p95_latency=8.71`
   - `auth_refresh_failed_rate=0`
   - `workflow_422_rate=0`
   - `summary.isHealthy=true`
3. `GET /api/v1/internal/alerts/operational`
   - `lastEvaluationStatus=degraded`
   - `activeRules=1` (`error_rate_24h`)

### Resumen historico

1. `history?window=24h`:
   - `samples=814`
   - `errorRate=0.253`
   - `p95Latency=500.82`
   - `count5xx=0`
2. `history?window=7d`:
   - `samples=952`
   - `errorRate=0.2246`
   - `p95Latency=494.78`
   - `count5xx=0`

## Lectura tecnica

1. La ventana limpia confirma estabilidad de runtime actual:
   - `isHealthy=true` en snapshot de proceso.
   - `0` errores y `0` respuestas `5xx` durante la ventana.
2. El estado `degraded` en alertas corresponde al agregado historico `24h/7d` (arrastra trafico de pruebas negativas previas), no a degradacion del tramo limpio de observacion.

## Criterio de cierre M5-E1

1. Corrida controlada post-RC ejecutada (`M5-E1`).
2. Ventana steady-state ejecutada y documentada (`M5-E1-02`).
3. Evidencia de estabilidad runtime capturada (sin `5xx`, error de ventana = `0`).

## Resultado

**M5-E1 CERRADO FORMALMENTE** (con observacion de sesgo historico en alertas por trafico de prueba).
