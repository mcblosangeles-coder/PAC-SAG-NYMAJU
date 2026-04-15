# M5-E1 - Corrida Controlada Post-RC (baseline `c837dd9`)

## Fecha
2026-04-15

## Objetivo

Ejecutar la primera corrida operativa post-RC para verificar estabilidad tecnica y estado de monitoreo sobre baseline `c837dd9`.

## Baseline de ejecucion

1. Baseline objetivo: `c837dd9`.
2. Rama de ejecucion: `main`.
3. Contexto previo: M5-D1 cerrado con decision `GO` controlado.

## Secuencia ejecutada

1. `pnpm.cmd preflight:local`
2. Consulta operativa de endpoints internos:
   - `GET /api/v1/health`
   - `GET /api/v1/internal/metrics`
   - `GET /api/v1/internal/alerts/operational`
   - `GET /api/v1/internal/metrics/history?window=24h`
   - `GET /api/v1/internal/metrics/history?window=7d`

## Evidencia tecnica (corrida)

Resultado `preflight:local`:

1. `smoke:local` -> PASS.
2. `@pac/api typecheck` -> PASS.
3. `@pac/api test:unit` -> PASS (`10/10`).
4. `@pac/api test:e2e` -> PASS (`43/43`).
5. Estado final de script -> `Preflight local completado: PASS`.

## Evidencia de monitoreo (snapshot post-corrida)

Snapshot obtenido inmediatamente despues de la corrida:

1. `health`:
   - `{"service":"api","status":"ok"}`
2. `metrics.summary`:
   - `isHealthy=false`
   - `failingMetrics=error_rate,auth_refresh_failed_rate,workflow_422_rate`
3. Valores relevantes:
   - `error_rate=0.2083`
   - `p95_latency=494.78`
   - `5xx_count=0`
   - `auth_refresh_failed_rate=0.75`
   - `workflow_422_rate=1`
4. `alerts`:
   - `lastEvaluationStatus=degraded`
   - `activeRules=1`
   - mensaje: `Alertas activas: 1/3.`
5. `history (24h)` resumen:
   - `samples=813`
   - `errorRate=0.2754`
   - `p95Latency=500.82`
   - `count5xx=0`

## Lectura tecnica de estabilidad

1. Estabilidad de servicio base: **OK** (`health=ok`, sin caidas observadas).
2. Calidad tecnica de release: **OK** (preflight local en verde).
3. Riesgo de disponibilidad inmediata: **Bajo** (sin `5xx`, `count5xx=0`).
4. Estado de monitoreo: **degradado por trafico de prueba** (suite e2e/negativa eleva `error_rate`, `auth_refresh_failed_rate` y `workflow_422_rate`).

## Decision operativa M5-E1 (corrida 1)

1. Resultado de la corrida: **PASS controlado**.
2. Estado del bloque: **M5-E1 INICIADO**.
3. Interpretacion: la degradacion actual de alertas corresponde al perfil de trafico de validacion (no a falla de infraestructura ni a incremento de `5xx`).

## Siguiente paso operativo recomendado

1. Ejecutar una ventana corta de observacion con trafico funcional limpio (sin pruebas negativas) para obtener snapshot de referencia `steady-state`.
2. Registrar ese snapshot como evidencia M5-E1-02 y ajustar umbrales/lectura operativa si aplica.
