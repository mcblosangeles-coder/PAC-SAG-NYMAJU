# M3-E3 - Automatizacion de alertas operativas

## Objetivo

Automatizar evaluacion periodica de metricas historicas (M3-E2) con reglas minimas de notificacion para control operacional continuo.

## Avance detallado (secuencial)

1. Configuracion operacional de evaluador:
- `ALERTS_EVALUATOR_ENABLED`
- `ALERTS_EVALUATOR_INTERVAL_SECONDS`
- `ALERTS_NOTIFICATION_COOLDOWN_SECONDS`
- `ALERTS_NOTIFY_CHANNELS=log,audit`

2. Reglas implementadas sobre historico 24h:
- `error_rate_24h` (warning): breach cuando `error_rate > 0.05`.
- `p95_latency_24h` (warning): breach cuando `p95_latency > 700ms`.
- `count_5xx_24h` (critical): breach cuando `5xx_count >= 5`.

3. Evaluador periodico:
- job interno `operationalAlertsService.startEvaluator()`,
- consume `metricsHistoryService.getHistoricalMetrics("24h")`,
- transiciones soportadas: `triggered`, `resolved`, `ongoing`,
- enfriamiento de notificacion por regla (cooldown configurable).

4. Reglas de notificacion:
- canal `log`: evento estructurado `alerts.operational.transition`,
- canal `audit`: trazabilidad en `audit_logs` con acciones:
  - `ops.alert.triggered`
  - `ops.alert.resolved`
  - `ops.alert.ongoing`

5. Observabilidad y control interno:
- `GET /api/v1/internal/alerts/operational` (estado actual evaluador/reglas),
- `POST /api/v1/internal/alerts/operational/evaluate` (evaluacion manual on-demand).

## Criterio de salida M3-E3

1. Existe evaluador periodico activo de alertas sobre historico persistido.
2. Existen reglas de notificacion explicitas y configurables.
3. Existe consulta interna de estado de alertas.
4. Existe ejecucion manual de evaluacion para validacion operativa.
5. Acta de MacroFase 3 actualizada con trazabilidad de avances.

## Riesgos residuales

1. Evaluador in-process:
- si la API cae, no se ejecuta evaluacion hasta reinicio.

2. Canales de notificacion MVP:
- solo `log` y `audit` (sin integracion externa a pager/chat/SIEM activo).

3. Calibracion de umbrales:
- umbrales iniciales requieren ajuste con carga real y baseline productivo.
