# M5-F2 - Runbook de operación (señal operacional vs validación)

## Objetivo
Mantener monitoreo/alertas sobre señal operacional real, aislando tráfico de QA/UAT.

## Parámetros críticos

1. `QA_INTERNAL_HOSTNAMES`: hostnames QA forzados a `validation` (ej: `qa-api.revisor.cl`).
2. `QA_INTERNAL_PATH_PREFIX`: ruta QA aislada (default: `/api/v1/internal/qa`).
3. `TRAFFIC_PROFILE_REJECT_ON_MISSING_HEADER`: en producción, rechaza request sin `x-traffic-profile`.
4. `TRAFFIC_PROFILE_REJECT_ON_INVALID_HEADER`: rechaza valores distintos de `operational|validation`.

## Política operativa

1. Dashboards y monitoreo diario deben consultar `profile=operational`.
2. QA/UAT debe usar host QA o ruta QA (`/api/v1/internal/qa/*`).
3. Tráfico de tests automatizados debe enviar `x-traffic-profile: validation`.
4. No usar `profile=all` para decisiones operacionales.

## Verificación diaria (5 minutos)

1. Snapshot operacional:
`GET /api/v1/internal/metrics?profile=operational`

2. Histórico operacional:
`GET /api/v1/internal/metrics/history?window=24h&profile=operational`

3. Estado de alertas operacional:
`GET /api/v1/internal/alerts/operational?profile=operational`

4. Confirmar SLO de etiquetado:
- métrica `profile_header_valid_rate` >= `0.999`.

## Manejo de desvíos

### Caso A: `profile_header_valid_rate < 0.999`
1. Revisar eventos `security.metrics_profile_missing` y `security.metrics_profile_invalid`.
2. Verificar proxy de borde (inyección/override de `x-traffic-profile`).
3. Confirmar que tráfico QA no esté entrando por host operacional.
4. Ejecutar reevaluación:
`POST /api/v1/internal/alerts/operational/evaluate?profile=operational`

### Caso B: alerta activa por perfil de etiquetado
1. Corregir borde (regla de inyección/rechazo).
2. Confirmar recuperación en ventana 24h.
3. Registrar ACK/SILENCE solo si hay ventana de mantención aprobada.

## Evidencia mínima de operación

1. Captura JSON de `metrics` operacional.
2. Captura JSON de `history` operacional.
3. Captura JSON de `alerts` operacional.
4. Registro de acciones (`/actions`) y eventos (`/events`) cuando aplique.
