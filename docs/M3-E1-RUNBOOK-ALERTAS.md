# M3-E1 - RUNBOOK DE ALERTAS Y RESPUESTA OPERATIVA

## Objetivo

Definir respuesta operativa minima para alertas del API basadas en metricas M3-E1.

## Fuente de verdad

- Endpoint interno: `GET /api/v1/internal/metrics`
- Token opcional: header `x-metrics-token` (si `METRICS_TOKEN` esta configurado).
- Ventana de medicion: acumulada en memoria desde inicio del proceso.

## Alertas activas (MVP)

1. `error_rate > 0.05`
2. `p95_latency > 700ms`
3. `5xx_count >= 5`
4. `auth_refresh_failed_rate > 0.20`
5. `audit_log_failed_count >= 1`
6. `workflow_422_rate > 0.25`

## Procedimiento de triage (orden)

1. Confirmar alerta
- consultar `/api/v1/internal/metrics`
- validar `summary.failingMetrics`

2. Determinar severidad
- Critica:
  - `5xx_count`
  - `audit_log_failed_count`
- Alta:
  - `error_rate`
  - `p95_latency`
- Media:
  - `auth_refresh_failed_rate`
  - `workflow_422_rate`

3. Identificar impacto
- endpoint(s) afectados
- usuarios/flujo impactado
- inicio aproximado del incidente

4. Aplicar contencion
- revisar despliegue reciente
- reducir carga no critica (si aplica)
- pausar jobs no esenciales (si aplica)

5. Escalar
- notificar responsable tecnico
- abrir incidente con:
  - metrica fallida
  - valor actual
  - umbral
  - hora de deteccion
  - accion aplicada

## Playbooks por metrica

### A) `error_rate` / `5xx_count`

Chequeos:
- revisar logs `http.request.failed`
- identificar endpoint con mayor fallo
- validar estado de DB/Redis

Accion:
- rollback o hotfix segun causa
- monitorear recuperacion por 15 minutos

### B) `p95_latency`

Chequeos:
- endpoints de mayor latencia
- saturacion de DB
- tiempos de respuesta externos (si hay integraciones)

Accion:
- reducir concurrencia de tareas no criticas
- revisar query/indice si la degradacion persiste

### C) `auth_refresh_failed_rate`

Chequeos:
- eventos `auth.refresh_failed` / `auth.refresh_replay_detected`
- cambios recientes en secrets/JWT expirations

Accion:
- validar clocks/expiraciones
- confirmar no haya invalidez masiva de sesiones

### D) `audit_log_failed_count`

Chequeos:
- eventos `audit.log.failed_non_blocking`
- conectividad/estado de base de datos

Accion:
- tratar como incidente de cumplimiento trazabilidad
- priorizar restauracion de persistencia de auditoria

### E) `workflow_422_rate`

Chequeos:
- tendencia de bloqueos de negocio reales vs errores de input
- correlacion con cambios de reglas de workflow

Accion:
- si es comportamiento esperado, registrar evento operativo y mantener monitoreo
- si es regresion, abrir bug y corregir reglas/validaciones

## Criterio de recuperacion

Incidente se considera contenido cuando:

1. `summary.failingMetrics` vuelve vacio en 3 revisiones consecutivas.
2. no hay incremento de `5xx_count` ni `audit_log_failed_count`.
3. se registra causa raiz preliminar y accion correctiva.

## Evidencia minima de cierre

- captura de `/api/v1/internal/metrics` pre y post mitigacion
- lista de acciones realizadas
- decision final:
  - mitigado temporalmente, o
  - corregido definitivamente
