# ACTA DE AVANCE - MACROFASE 3

## Fecha
2026-04-13

## Estado general

- MacroFase 3: INICIADA
- Bloque A (Dominio funcional de expedientes): EN CURSO

## Actualizacion M3-A1

Se ejecuta actividad de arranque M3-A1: definicion de backlog funcional priorizado.

### Entregable

1. Documento generado: `docs/BACKLOG-M3-FUNCIONAL.md`.

### Contenido cubierto

1. Historias/actividades priorizadas (`P1`, `P2`, `P3`).
2. Dependencias por actividad.
3. Estado inicial por item.
4. Actividades inmediatas para sprint de arranque.
5. Criterios globales de aceptacion para el bloque.

## Resultado

- M3-A1 (definicion de backlog funcional): AVANZADO Y VALIDADO.

## Siguiente punto

M3-A2: definir contrato API de consulta operativa de expediente (request/response, errores y criterios de aceptacion).

## Actualizacion M3-A1.1 (ajuste de backlog para validacion final)

Se aplican ajustes directos al backlog funcional para mejorar ejecutabilidad:

1. Prioridades ajustadas:
- `M3-A1-08 (CI minimo)` sube a `P1`.
- `M3-A1-05 (auditoria consultable)` pasa a `P2`.
2. Secuencia refinada por sprint:
- Sprint 1: `M3-A1-01`, `M3-A1-02`, base `M3-A1-03`, arranque `M3-A1-08`.
- Sprint 2: cierre `M3-A1-03` + `M3-A1-04`.
3. Se agrega DoD minimo por historia.
4. Se explicita estrategia de paralelizacion (A3, A8, A9).

## Resultado

- M3-A1 queda listo para validacion final.
- Condiciones de continuidad: habilitadas para iniciar M3-A2.

## Actualizacion M3-A2 (definicion de contrato API)

Se define contrato formal para consulta operativa de expediente:

1. Documento generado:
- `docs/CONTRATO-API-CONSULTA-OPERATIVA-EXPEDIENTE.md`
2. Alcance del contrato:
- endpoint `GET /api/v1/expedientes/:id`,
- payload de exito `200`,
- errores `400/401/403/404/500` con `code + message`,
- criterios de aceptacion para implementacion.

## Resultado

- M3-A2 (definicion de contrato): AVANZADO Y VALIDADO.

## Siguiente punto

M3-A3: implementar endpoint de consulta operativa de expediente segun contrato y cubrir pruebas (unit + e2e).

## Actualizacion M3-A3 (implementacion consulta operativa)

Se implementa endpoint operativo y cobertura de pruebas segun contrato M3-A2.

1. Implementacion tecnica:
- Nuevo endpoint `GET /api/v1/expedientes/:id` en `expedientes.routes.ts`.
- Servicio `expedientesService.getOperationalSummary(...)` con consulta real en Prisma:
  - expediente activo (`deletedAt: null`),
  - resumen de etapas,
  - responsable actual,
  - conteo de bloqueos por alertas activas blocking y no conformidades abiertas/en proceso de severidad mayor/critica.
- Mapper de salida operativa aplicado para alinear payload final.

2. Pruebas agregadas/actualizadas:
- Unit:
  - `operational-summary.mapper.unit.test.ts` (prioridad de responsable + reglas de bloqueos/canAdvance).
- E2E:
  - casos `200`, `400`, `403`, `404` para `GET /api/v1/expedientes/:id`.

3. Evidencia de validacion tecnica:
- `pnpm.cmd --filter @pac/api typecheck` -> OK.
- `pnpm.cmd --filter @pac/api test:unit` -> OK (7/7).
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (21/21).

## Resultado

- M3-A3 (consulta operativa endpoint + pruebas): IMPLEMENTADO Y VALIDADO.

## Siguiente punto

M3-A4: listar y acordar siguiente historia P1 de MacroFase 3 para implementacion (recomendado: flujo de `expedientes.change_state` completo sobre workflow + side effects controlados).

## Actualizacion M3-A4 (reglas de workflow y precondiciones)

Se completa ajuste de reglas de dominio para transiciones de estado en `changeState`:

1. Transiciones invalidas se mantienen en `409`.
2. Se agrega validacion de precondiciones de avance para estados de cierre (`APROBADO`, `INGRESADO`, `CERRADO`):
- si existen alertas activas blocking o NC abiertas/en proceso de severidad mayor/critica, la transicion falla con `422`.
3. Se estandariza mapeo de errores:
- nuevo codigo API `UNPROCESSABLE_ENTITY` para estado `422`.
4. Se amplian pruebas:
- unit de mapping para `422`,
- e2e para `change-state` con precondicion incumplida (`422`).

## Resultado

- M3-A4 (workflow rules 409/422): IMPLEMENTADO Y VALIDADO.

## Actualizacion M3-A5 (historial de estados por expediente)

Se implementa endpoint de historial con filtros basicos y paginacion inicial:

1. Endpoint:
- `GET /api/v1/expedientes/:id/history`
2. Parametros iniciales:
- `page` (default `1`),
- `pageSize` (default `20`, max `100`),
- `scope` (`all|global|stage`, default `all`).
3. Payload:
- items combinados de historial global + historial de etapas, ordenados por fecha descendente.
- metadata de paginacion (`page`, `pageSize`, `total`, `totalPages`, `hasNext`).
4. Pruebas e2e agregadas:
- `200` respuesta valida,
- `400` query invalida,
- `404` expediente inexistente.

## Evidencia tecnica (M3-A4 + M3-A5)

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:unit` -> OK (8/8).
3. `pnpm.cmd --filter @pac/api test:e2e` -> OK (25/25).

## Resultado

- M3-A5 (historial de estados): IMPLEMENTADO Y VALIDADO.

## Siguiente punto

M3-A1-08 / Bloque CI minimo: abrir workflow de CI con quality gates (`typecheck`, `test:unit`, `test:e2e`, preflight).

## Actualizacion M3-C1 (CI minimo con quality gates)

Se implementa pipeline inicial de calidad para PR/merge:

1. Nuevo workflow:
- `.github/workflows/ci.yml`
- triggers: `pull_request` y `push` sobre `main/master`.
2. Servicios de soporte en CI:
- Postgres 16
- Redis 7
3. Gates ejecutados:
- `typecheck` API
- `test:unit` API
- `test:e2e` API
4. Se agrega script raiz cross-platform:
- `preflight:ci`
- motivo: `preflight:local` es Windows-only y no es portable a runner Linux.

## Evidencia tecnica (M3-C1)

1. `pnpm.cmd preflight:ci` -> OK local.
2. Gates en verde:
- unit: 8/8
- e2e: 25/25

## Resultado

- M3-C1 (CI minimo): IMPLEMENTADO Y VALIDADO EN LOCAL.

## Siguiente punto

M3-B1: disenar esquema de refresh tokens (persistencia + ciclo de vida) para hardening de sesion.

## Actualizacion M3-B1 (diseno de refresh tokens persistentes)

Se ejecuta M3-B1 y se documenta diseno tecnico ejecutable para hardening de sesion:

1. Entregable:
- `docs/M3-B1-DISENO-REFRESH-TOKENS.md`
2. Cobertura del diseno:
- modelo Prisma `UserSession`,
- rotacion de refresh token por uso,
- revocacion en logout,
- revocacion de familia por replay detectado,
- almacenamiento por hash (no token plano),
- plan de implementacion M3-B2/B3 por etapas.

## Resultado

- M3-B1 (diseno persistencia refresh token): AVANZADO Y LISTO PARA VALIDACION.

## Actualizacion M3-B1.1 (ajustes tecnicos de validacion)

Se incorporan ajustes solicitados sobre el diseno M3-B1 para reducir riesgo de implementacion:

1. Cadena de rotacion por referencia relacional (`parentSessionId` / `replacedBySessionId`) en lugar de hash.
2. Rotacion `refresh` declarada como operacion transaccional obligatoria.
3. Claims minimos de refresh JWT explicitados (`sub`, `jti`, `type`, `family`, `exp`).
4. Logout idempotente definido (`204` salvo token malformado/firma invalida).
5. Observabilidad de uso de sesion (`lastUsedAt`, `lastUsedByIp`).
6. Politica criptografica definida como `HMAC-SHA256` con secreto de servidor.
7. Politica de limite de sesiones cerrada (revocar sesion activa mas antigua).
8. Retencion forense definida para purga (30-90 dias).
9. Reglas de replay reforzadas (revocacion de familia + auditoria alta + 401).

## Resultado

- M3-B1 queda AJUSTADO Y LISTO PARA IMPLEMENTACION (M3-B2).

## Siguiente punto

M3-B2: implementar schema + migracion inicial de sesiones persistentes (`UserSession`) e integrar `auth` (login/refresh/logout) con store.

## Actualizacion M3-B2 (implementacion sesiones persistentes en auth)

Se ejecuta implementacion completa de M3-B2:

1. `schema.prisma`:
- se agrega modelo `UserSession` con:
  - hash unico de refresh token,
  - cadena relacional de rotacion (`parentSessionId`, `replacedBySessionId`),
  - campos de observabilidad (`lastUsedAt`, `lastUsedByIp`, `userAgent`),
  - estado de revocacion/expiracion.
- se agrega relacion `sessions` en `Usuario`.

2. Migracion aplicada:
- `20260414034714_m3_b2_user_sessions`.
- base local sincronizada con nuevo modelo.

3. Integracion `auth`:
- nuevo `session.service.ts` (create/rotate/revoke/enforce limit).
- `auth.service.ts` migrado a refresh persistente:
  - login crea sesion persistente,
  - refresh valida claims (`sub`, `jti`, `type`, `family`, `exp`) y rota en transaccion,
  - logout idempotente revoca por token (firma invalida => 401).
- `auth.routes.ts` propaga `ip`/`user-agent` y soporta `refreshToken` en logout.

## Evidencia tecnica (M3-B2)

1. `pnpm.cmd db:generate` -> OK.
2. `pnpm.cmd prisma migrate dev --name m3_b2_user_sessions` -> OK.
3. `pnpm.cmd --filter @pac/api typecheck` -> OK.
4. `pnpm.cmd --filter @pac/api test:unit` -> OK (8/8).
5. `pnpm.cmd --filter @pac/api test:e2e` -> OK (25/25).

## Resultado

- M3-B2: IMPLEMENTADO Y VALIDADO.

## Siguiente punto

M3-B3: fortalecer pruebas de seguridad de sesion (rotacion efectiva, replay detection, logout revocation) y auditoria asociada.

## Actualizacion M3-B3 (seguridad de sesion + auditoria auth)

Se cierra M3-B3 con implementacion y evidencia:

1. Seguridad de sesion:
- se agregan pruebas e2e especificas para:
  - rotacion refresh exitosa,
  - reutilizacion de refresh previo (`replay`) con respuesta `401`,
  - revocacion de familia al detectar replay,
  - logout idempotente y bloqueo de refresh revocado,
  - logout con token malformado (`401`).

2. Auditoria de eventos auth:
- `auth.service` registra eventos en `audit_logs`:
  - `auth.login`,
  - `auth.login_failed`,
  - `auth.refresh`,
  - `auth.refresh_failed`,
  - `auth.refresh_replay_detected`,
  - `auth.logout`,
  - `auth.logout_failed`.
- los tests M3-B3 verifican presencia de eventos clave (`auth.login`, `auth.refresh`, `auth.refresh_replay_detected`, `auth.logout`).

## Evidencia tecnica (M3-B3)

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (28/28).

## Resultado

- M3-B3: IMPLEMENTADO Y VALIDADO.

## Siguiente punto

MacroFase 3 - siguiente frente recomendado: M3-D1 (logging estructurado estandar en API) o cierre parcial de Bloque B con checklist de sesion.

## Actualizacion M3-D1 (logging estructurado estandar API)

Se implementa estandar minimo de logging estructurado JSON en API:

1. Logger comun:
- nuevo modulo `apps/api/src/lib/logger.ts` con niveles (`debug`, `info`, `warn`, `error`) y estructura uniforme:
  - `timestamp`, `level`, `service`, `environment`, `event`, `message`, `context`.
2. Instrumentacion HTTP base:
- middleware en `app.ts` para:
  - asignar/propagar `x-request-id`,
  - registrar `http.request.started`,
  - registrar `http.request.completed` con `statusCode` y `durationMs`.
3. Manejo de errores:
- error handler global reemplaza `console.error` por `logger.error` con `requestId`, `method` y `path`.
4. Auditoria no bloqueante:
- `audit.service.ts` reemplaza `console.error` por evento `audit.log.failed_non_blocking` con contexto de accion/scope.
5. Arranque API:
- `main.ts` reemplaza log libre por evento estructurado `api.started`.

## Evidencia tecnica (M3-D1)

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (28/28).

## Resultado

- M3-D1: IMPLEMENTADO Y VALIDADO.

## Cierre parcial Bloque B (M3-B)

Se deja checklist final de sesion en:

- `docs/CHECKLIST-CIERRE-BLOQUE-B-M3.md`

Estado: Bloque B de MacroFase 3 (M3-B1/B2/B3) con cierre tecnico y trazabilidad documental.

## Actualizacion M3-D2 (diagnostico tecnico operativo de logging)

Se ejecuta diagnostico tecnico M3-D2 sobre estado real de logging API post M3-D1.

1. Entregable generado:
- `docs/M3-D2-DIAGNOSTICO-TECNICO.md`

2. Resultado del diagnostico:
- Formato JSON estructurado: CUMPLIDO.
- Correlacion por `x-request-id` con saneamiento: CUMPLIDO.
- Cobertura de eventos: PARCIAL (falta catalogo formal unificado).
- Control de volumen por entorno: ABIERTO.
- Politica formal de redaccion de sensibles: PARCIAL.
- Retencion/rotacion + SIEM: ABIERTO.

3. Conclusiones ejecutivas:
- Base tecnica de logging funcional y estable.
- Cierre M3-D2 requiere formalizar gobierno operativo (politica + catalogo + retencion/SIEM).

## Siguiente punto

M3-D2.1: construir y validar documentos normativos de cierre:

1. `docs/M3-D2-POLITICA-LOGGING.md`
2. `docs/M3-D2-CATALOGO-EVENTOS-API.md`
3. `docs/M3-D2-RETENCION-Y-SIEM.md`

## Actualizacion M3-D2.1 (cierre operativo logging)

Se ejecutan correcciones minimas para cierre M3-D2 sin rediseño del logger:

1. Politica por entorno en runtime:
- `development`: `info`, `http.request.started` habilitado.
- `test`: `warn` por defecto, `http.request.started` deshabilitado.
- `production`: `info`, `http.request.started` deshabilitado por defecto.
- overrides via variables:
  - `LOG_LEVEL_MIN`
  - `LOG_HTTP_REQUEST_STARTED`

2. Control de volumen:
- exclusion por patrones de ruta (`LOG_EXCLUDE_PATH_PATTERNS`),
- sampling HTTP global (`LOG_HTTP_SAMPLE_RATE`),
- sampling HTTP por ruta (`LOG_HTTP_PATH_SAMPLE_RULES`),
- sin sampling para `http.request.failed` ni eventos criticos.

3. Sanitizacion/redaccion:
- capa reutilizable de sanitizacion en logger para claves sensibles (`password`, `authorization`, tokens, cookies, secretos).
- valores sensibles se reemplazan por `"[REDACTED]"`.

4. Estandar operacional/documental:
- `docs/M3-D2-POLITICA-LOGGING.md`
- `docs/M3-D2-CATALOGO-EVENTOS-API.md`
- `docs/M3-D2-RETENCION-Y-SIEM.md`

## Evidencia tecnica (M3-D2.1)

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (28/28).

## Resultado

- M3-D2: CORREGIDO Y CERRADO PARA MVP.

## Cierre formal de validacion M3-D2

1. Documentos M3-D2 aprobados:
- `docs/M3-D2-POLITICA-LOGGING.md`
- `docs/M3-D2-CATALOGO-EVENTOS-API.md`
- `docs/M3-D2-RETENCION-Y-SIEM.md`

2. Cierre administrativo:
- redaccion final validada en acta.

3. Evidencia operativa de overrides:
- Escenario `production` default: se emite `http.request.completed` y no `http.request.started`.
- Escenario `test` default: `info` suprimido, `error` emitido.
- Escenario override + sanitizacion: redaccion `"[REDACTED]"` aplicada sobre claves sensibles (`password`, `authorization`, `accessToken`, `refreshToken`, `cookie`, `secret`).

Estado final:
- Validacion M3-D2: CERRADA.

## Actualizacion M3-E1 (puntos 1 y 2)

Se inicia M3-E1 y se ejecutan los dos primeros puntos:

1. Metricas minimas y umbrales definidos:
- documento: `docs/M3-E1-METRICAS-UMBRALES.md`
- metricas: `error_rate`, `p95_latency`, `5xx_count`, `auth_refresh_failed_rate`, `audit_log_failed_count`, `workflow_422_rate`.

2. Endpoint interno de metricas implementado:
- `GET /api/v1/internal/metrics`
- agregacion liviana en memoria.
- proteccion opcional con `METRICS_TOKEN` (`x-metrics-token`).

3. Integraciones tecnicas:
- captura automatica por request en middleware HTTP (status + latencia),
- conteo de fallo operativo de auditoria (`audit.log.failed_non_blocking`).

## Estado

- M3-E1 punto 1: COMPLETADO.
- M3-E1 punto 2: COMPLETADO.
- M3-E1 puntos 3, 4 y 5: COMPLETADOS.

## Actualizacion M3-E1 (puntos 3, 4 y 5)

Se completa cierre secuencial de M3-E1:

1. Punto 3 - Runbook de alertas:
- documento generado: `docs/M3-E1-RUNBOOK-ALERTAS.md`
- contiene:
  - umbrales activos,
  - triage por severidad,
  - playbooks por metrica,
  - criterio de recuperacion y evidencia de cierre.

2. Punto 4 - Checklist pre-release:
- `docs/CHECKLIST-PRE-RELEASE-LOCAL.md` actualizado con paso 6 de observabilidad.
- se incorpora verificacion de `/api/v1/internal/metrics` y contrato de 6 metricas.

3. Punto 5 - Cierre formal en acta:
- criterio de salida M3-E1 documentado.
- riesgos residuales explicitados.

## Criterio de salida M3-E1

M3-E1 se considera cerrado cuando:

1. existen metricas minimas y umbrales definidos,
2. existe endpoint interno operativo de metricas,
3. existe runbook de respuesta ante alertas,
4. checklist pre-release incorpora verificacion de observabilidad.

Estado: CUMPLIDO.

## Riesgos residuales M3-E1

1. Agregacion en memoria:
- resetea en reinicio de proceso y no soporta historico.

2. Falta integracion externa:
- sin collector/TSDB/SIEM conectado aun (pendiente fase posterior).

3. Umbrales iniciales:
- requieren calibracion con trafico real en ambiente estable.

## Resultado final M3-E1

- M3-E1: CERRADO (puntos 1 al 5 completados).

## Actualizacion M3-E2 (persistencia historica de metricas)

Se ejecuta M3-E2 para cerrar historico de observabilidad operacional:

1. Definicion de stack minimo:
- decision aplicada: Postgres time-series simple (tabla de snapshots), sin incorporar Prometheus en este bloque.
- documento: `docs/M3-E2-PERSISTENCIA-HISTORICA-METRICAS.md`.

2. Modelo y retencion:
- nuevo modelo Prisma `OperationalMetricSnapshot`.
- migracion: `20260414123000_m3_e2_operational_metrics_history`.
- retencion configurable por `METRICS_RETENTION_DAYS` (default 30).

3. Exportacion persistente:
- collector interno implementado en `metrics-history.service.ts`.
- ejecucion periodica configurable (`METRICS_COLLECTOR_INTERVAL_SECONDS`).
- persistencia por `upsert` + purga automatica por retencion.

4. Consulta historica:
- endpoint `GET /api/v1/internal/metrics/history?window=24h|7d`.
- salida con serie temporal de `errorRate`, `p95Latency`, `count5xx` y resumen agregado.

## Criterio de salida M3-E2

1. Persistencia historica implementada en almacenamiento durable.
2. Consulta 24h/7d operativa para metricas objetivo (`error_rate`, `p95_latency`, `5xx_count`).
3. Ventana de retencion definida y automatizada.
4. Acta/documentacion actualizadas.

Estado: IMPLEMENTADO (pendiente validacion operativa en entorno local/CI).

## Actualizacion M3-E3 (automatizacion de alertas)

Se ejecuta M3-E3 con registro detallado de avances:

### Avance 1 - Configuracion de evaluador y notificaciones

1. Se incorporan variables de entorno para control operacional:
- `ALERTS_EVALUATOR_ENABLED`
- `ALERTS_EVALUATOR_INTERVAL_SECONDS`
- `ALERTS_NOTIFICATION_COOLDOWN_SECONDS`
- `ALERTS_NOTIFY_CHANNELS`

2. Se actualiza `.env.example` con defaults ejecutables para local/MVP.

### Avance 2 - Servicio de evaluacion periodica

1. Se implementa `operational-alerts.service.ts` con reglas minimas:
- `error_rate_24h` (warning),
- `p95_latency_24h` (warning),
- `count_5xx_24h` (critical).

2. Fuente de evaluacion:
- historico persistido M3-E2 (`metricsHistoryService.getHistoricalMetrics("24h")`).

3. Transiciones automatizadas:
- `triggered`, `resolved`, `ongoing`.

4. Se aplica cooldown de notificaciones por regla para evitar ruido.

### Avance 3 - Reglas de notificacion

1. Canal `log`:
- evento estructurado `alerts.operational.transition`.

2. Canal `audit`:
- acciones registradas en auditoria:
  - `ops.alert.triggered`
  - `ops.alert.resolved`
  - `ops.alert.ongoing`

### Avance 4 - Exposicion operacional en API interna

1. `GET /api/v1/internal/alerts/operational`:
- estado del evaluador,
- estado por regla,
- ultimo resultado de evaluacion.

2. `POST /api/v1/internal/alerts/operational/evaluate`:
- ejecucion manual para validacion/control operativo.

### Avance 5 - Ciclo de vida del proceso

1. `main.ts` integra inicio/parada ordenada:
- `operationalAlertsService.startEvaluator()` en startup,
- `operationalAlertsService.stopEvaluator()` en shutdown.

### Avance 6 - Evidencia de pruebas

1. Pruebas e2e de endpoints internos ampliadas para alertas operativas:
- `403` sin token,
- `200` estado de alertas con token,
- `200` evaluacion manual on-demand.

## Criterio de salida M3-E3

1. Evaluador periodico implementado.
2. Reglas de notificacion implementadas.
3. Endpoint de estado operativo implementado.
4. Endpoint de evaluacion manual implementado.
5. Trazabilidad documental actualizada.

Estado: IMPLEMENTADO (pendiente validacion final de ejecucion local/CI).

## Actualizacion M3-E4 (dashboard operativo web)

Se ejecuta M3-E4 para consolidar observabilidad operacional en interfaz web.

### Avance 1 - Integracion de datos operativos

Se conecta `apps/web` a fuentes internas:

1. snapshot actual: `GET /api/v1/internal/metrics`,
2. historico: `GET /api/v1/internal/metrics/history?window=24h|7d`,
3. alertas: `GET /api/v1/internal/alerts/operational`.

Incluye uso de `x-metrics-token` configurable desde UI.

### Avance 2 - Dashboard funcional

Se implementan vistas de:

1. salud operacional global,
2. estado del evaluador de alertas,
3. conteo de reglas activas,
4. tabla de metricas con umbral/estado por item.

### Avance 3 - Tendencias 24h/7d

Se agregan visualizaciones SVG para:

1. `error_rate`,
2. `p95_latency`,
3. `5xx_count`.

Con selector de ventana entre 24 horas y 7 dias.

### Avance 4 - Robustez UX operativa

1. carga inicial automatica,
2. refresco manual,
3. manejo de errores visibles,
4. persistencia local del token para continuidad operativa.

### Avance 5 - Trazabilidad documental

Se genera documento:
- `docs/M3-E4-DASHBOARD-OPERATIVO.md`

## Criterio de salida M3-E4

1. dashboard web consume datos reales de M3-E2/M3-E3,
2. muestra estado de alertas y tendencias 24h/7d,
3. compila y pasa typecheck en workspace.

Estado: IMPLEMENTADO (pendiente validacion funcional visual en navegador).

## Cierre de validacion funcional M3-E4

Fecha cierre: 2026-04-14

Resultado de validacion:

1. Dashboard operativo levantado en entorno local web.
2. Integracion API interna validada tras ajuste de `CORS_ORIGIN` al puerto activo de Vite.
3. Tres vistas requeridas confirmadas:
- estado de alertas,
- tabla snapshot de metricas,
- tendencias 24h/7d.

Estado final M3-E4:
- VALIDADO Y CERRADO.

## Apertura M3-E5 (acciones operativas desde dashboard)

Se abre M3-E5 con foco en control operacional accionable sobre alertas:

1. `acknowledge` por regla (asignar responsable/comentario y marcar gestion inicial).
2. `silence` por regla con ventana temporal y motivo.
3. historial de eventos de alerta para trazabilidad operacional.

Entregable de apertura:
- `docs/M3-E5-ACCIONES-OPERATIVAS-DASHBOARD.md`

Estado inicial M3-E5:
- ABIERTO (diseno y secuencia listos para implementacion).

## Baseline pre-M3-E5 (validacion tecnica y funcional)

Fecha cierre baseline: 2026-04-14

## Evidencia funcional

1. Dashboard M3-E4 operativo en navegador:
- estado de alertas visible,
- snapshot de metricas visible,
- tendencias 24h/7d visibles.

2. Endpoints internos validados:
- `GET /api/v1/internal/metrics` -> OK (payload con `summary.isHealthy=true` y metricas esperadas).
- `GET /api/v1/internal/alerts/operational` -> OK (reglas y estado de evaluador).
- `GET /api/v1/internal/metrics/history?window=24h` -> OK (serie + summary).
- `GET /api/v1/internal/metrics/history?window=7d` -> OK (serie + summary).

## Evidencia de regresion tecnica

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`36/36`).
3. `pnpm.cmd --filter @pac/web typecheck` -> OK.
4. `pnpm.cmd --filter @pac/web build` -> OK.

## Resultado

Baseline pre-M3-E5: APROBADO.

Condicion de inicio M3-E5:
- habilitada para implementar `acknowledge/silence/history` sobre alertas operativas.

## Actualizacion M3-E5 - Paso 1 (schema.prisma + migracion)

Se ejecuta inicio inmediato de M3-E5 con foco en persistencia base para acciones/eventos de alerta.

## Avance 1 - Cambio de esquema Prisma

1. Se agregan enums:
- `OperationalAlertActionType` (`ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`).
- `OperationalAlertEventType` (`TRIGGERED`, `ONGOING`, `RESOLVED`, `ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`).

2. Se agregan modelos:
- `OperationalAlertAction` (`operational_alert_actions`).
- `OperationalAlertEvent` (`operational_alert_events`).

## Avance 2 - Migracion aplicada

1. Migracion creada:
- `20260414173135_m3_e5_alert_actions_events`.

2. Estado:
- aplicada exitosamente en base local (`prisma migrate dev`).

## Observacion tecnica

Al finalizar migracion, `prisma generate` reporta `EPERM` en reemplazo de `query_engine-windows.dll.node` (archivo en uso por proceso activo).

Accion operativa recomendada:
1. detener procesos `pnpm --filter @pac/api dev` y `pnpm --filter @pac/web dev`,
2. ejecutar `pnpm db:generate`,
3. continuar con M3-E5 Paso 2 (servicio + endpoints).

Estado M3-E5 Paso 1:
- IMPLEMENTADO (migracion aplicada, pendiente regeneracion cliente Prisma sin lock).

## Cierre de revision y comprobaciones M3-E5 Paso 1

1. `pnpm db:migrate:deploy`:
- sin migraciones pendientes (estado consistente).

2. Lock Prisma resuelto:
- se detienen procesos `node/tsx/vite` del workspace que mantenian `query_engine-windows.dll.node` en uso.

3. `pnpm db:generate`:
- OK (Prisma Client regenerado).

4. `pnpm --filter @pac/api typecheck`:
- OK.

Estado final M3-E5 Paso 1:
- VALIDADO Y CERRADO.

## Actualizacion M3-E5 - Paso 2 (backend acknowledge/silence/unsilence/history)

Fecha cierre: 2026-04-14

Se implementa y valida funcionalmente la gestion operativa de alertas en backend:

1. Endpoints implementados:
- `POST /api/v1/internal/alerts/operational/:ruleId/acknowledge`
- `POST /api/v1/internal/alerts/operational/:ruleId/silence`
- `POST /api/v1/internal/alerts/operational/:ruleId/unsilence`
- `GET /api/v1/internal/alerts/operational/actions`
- `GET /api/v1/internal/alerts/operational/events`

2. Comandos de validacion ejecutados:
- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (`38/38`)
- `irm "$BASE/api/v1/internal/alerts/operational" -Headers $headers` -> OK
- `irm "$BASE/api/v1/internal/alerts/operational/error_rate_24h/acknowledge" -Method POST -Headers $headers -Body $ackBody` -> OK
- `irm "$BASE/api/v1/internal/alerts/operational/error_rate_24h/silence" -Method POST -Headers $headers -Body $silenceBody` -> OK
- `irm "$BASE/api/v1/internal/alerts/operational/error_rate_24h/unsilence" -Method POST -Headers $headers -Body $unsilenceBody` -> OK
- `irm "$BASE/api/v1/internal/alerts/operational/actions?ruleId=error_rate_24h&page=1&pageSize=20" -Headers $headers` -> OK
- `irm "$BASE/api/v1/internal/alerts/operational/events?ruleId=error_rate_24h&page=1&pageSize=20" -Headers $headers` -> OK

3. Endpoints validados (criterio funcional):
- se confirma persistencia de acciones (`ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`) en historial de acciones.
- se confirma persistencia de eventos (`ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`) en historial de eventos.
- se confirma cambio de estado `isSilenced=true` tras `silence` y retorno operativo con `unsilence`.

## Criterio de salida M3-E5 Paso 2

1. Backend de acciones operativas implementado.
2. Historial de acciones y eventos disponible por API.
3. Verificacion funcional manual completada en entorno local.
4. Typecheck y regresion e2e en verde.

Estado final M3-E5 Paso 2:
- IMPLEMENTADO, VALIDADO Y CERRADO.

## Actualizacion M3-E5 - Paso 3 (UI dashboard: acciones operativas + timeline)

Fecha avance: 2026-04-14

1. Implementacion UI en `apps/web`:
- panel de acciones operativas (acknowledge/silence/unsilence),
- selector de regla y operador,
- feedback de ejecucion por accion,
- lectura de estado `isSilenced`/`silencedUntil` por regla.

2. Timeline operativo integrado:
- historial de acciones (`/actions`) y eventos (`/events`),
- filtro por regla,
- paginacion y refresco manual.

3. Verificacion tecnica:
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.
- regresion backend: `pnpm.cmd --filter @pac/api test:e2e` -> OK (`38/38`).

4. Documento de verificacion E2E:
- `docs/M3-E5-VERIFICACION-E2E-UI-API.md`
- incluye criterios de aceptacion C1/C2/C3/C4 y secuencia de pruebas.

Estado M3-E5 Paso 3:
- IMPLEMENTADO (pendiente ejecucion/cierre funcional visual final en navegador segun checklist E2E).

## Cierre formal M3-E5 (validacion funcional visual final)

Fecha cierre: 2026-04-14

1. Verificacion visual en UI:
- bloque `Acciones Operativas de Alertas (M3-E5)` visible y funcional.
- bloque `Timeline Operativo de Alertas` visible y funcional.

2. Flujo operativo ejecutado en dashboard:
- `Acknowledge` -> OK.
- `Silence` -> OK.
- `Unsilence` -> OK.

3. Persistencia validada:
- timeline de acciones registra `ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`.
- timeline de eventos registra `ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`.

4. Regresion tecnica (evidencia vigente):
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (`38/38`).

Resultado de cierre:
- M3-E5 VALIDADO Y CERRADO FORMALMENTE.

## Paquete de release MacroFase 3

Fecha release: 2026-04-14

1. Commit de consolidacion:
- `1d43237` - `M3 release: close E5 UI/API E2E, docs, observability and session hardening`.

2. Push remoto:
- `origin/main` actualizado desde `aa529d3` a `1d43237`.

3. Evidencia tecnica de cierre:
- `pnpm.cmd preflight:ci` -> OK (API typecheck + unit + e2e).
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.

4. Estado repositorio post-release:
- working tree limpio.

5. Brecha tecnica detectada (post-check release):
- `pnpm.cmd lint` falla en `@pac/shared-utils`, `@pac/shared-types` y `@pac/web` por migracion pendiente a formato `eslint.config.*` (ESLint v9).
- impacto: no bloquea runtime ni pruebas funcionales, pero bloquea quality gate de lint global.
- accion recomendada siguiente: normalizar estrategia ESLint (flat config o downgrade controlado) y reactivar gate de lint en CI.

Estado final MacroFase 3 (alcance implementado hasta M3-E5):
- RELEASE PREPARADO Y PUBLICADO EN REPOSITORIO REMOTO.

## Hardening post-release - cierre de brecha lint ESLint v9

Fecha cierre: 2026-04-14

1. Accion aplicada:
- se incorpora configuracion flat global `eslint.config.mjs` para monorepo (ESLint v9).
- ajustes menores en codigo para resolver `no-unused-vars` y referencias de comentarios a reglas no disponibles.

2. Evidencia de cierre:
- `pnpm.cmd lint` -> OK (turbo lint en verde).
- `pnpm.cmd preflight:ci` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.

Resultado:
- brecha de lint global cerrada.

## Actualizacion M3-F1 (hardening de seguridad y operacion en produccion)

Fecha avance: 2026-04-14

Se ejecuta M3-F1 en el orden aprobado:

1. Gestion robusta de secretos y entorno:
- validaciones estrictas en `env.ts` para produccion (`NODE_ENV`, CORS, JWT, `METRICS_TOKEN`),
- politica formal documentada en `docs/M3-F1-POLITICA-SECRETOS-Y-ENTORNO.md`,
- `.env.example` actualizado con variables de hardening (`TRUST_PROXY`, `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_*`).

2. Rate limiting en endpoints sensibles:
- middleware `createRateLimitMiddleware` incorporado,
- aplicado en:
  - `/api/v1/auth/login`,
  - `/api/v1/auth/refresh`,
  - router interno `/api/v1/internal/*`.
- nuevo codigo API `RATE_LIMITED`.

3. Security headers y CORS por ambiente:
- headers de seguridad base en `app.ts`,
- HSTS en produccion,
- CORS con allowlist por `CORS_ALLOWED_ORIGINS`.

4. Operacion productiva:
- runbook de incidentes: `docs/M3-F1-RUNBOOK-INCIDENTES-PROD.md`,
- checklist de deploy productivo: `docs/M3-F1-CHECKLIST-DEPLOY-PROD.md`.

5. Gate CI final en flujo unico:
- `preflight:ci` actualizado a:
  - lint,
  - API typecheck,
  - API unit tests,
  - API e2e tests,
  - web build.
- workflow CI ajustado para ejecutar solo `pnpm preflight:ci` como gate final.

Estado M3-F1:
- IMPLEMENTADO (pendiente ejecucion final de verificacion local para cierre formal).

## Cierre validacion M3-F1

Fecha cierre: 2026-04-14

Evidencia ejecutada:

1. `pnpm.cmd preflight:ci` -> OK.
2. Flujo validado en una sola corrida:
- lint global,
- typecheck API,
- unit API,
- e2e API (`38/38`),
- build web.

Resultado final:
- M3-F1 VALIDADO Y CERRADO.

## Validacion operativa de riesgos M3-F1 (R1-R3)

Fecha: 2026-04-14

### Riesgo 1 - Rate limit en memoria (no distribuido/persistente)

Comandos ejecutados:
1. Proceso A: 3 llamadas consecutivas a `POST /api/v1/auth/login` con `RATE_LIMIT_AUTH_LOGIN_MAX=2`.
2. Proceso B (nuevo proceso): 1 llamada a `POST /api/v1/auth/login` con misma configuracion.

Resultado observado:
1. Proceso A: `400, 400, 429`.
2. Proceso B (tras reinicio de proceso): `400`.

Conclusión:
- el contador de rate limit no persiste entre reinicios de proceso (riesgo vigente para HA/escala horizontal).

### Riesgo 2 - Dependencia de TRUST_PROXY / X-Forwarded-For

Comando ejecutado:
1. API con `TRUST_PROXY=true` y `RATE_LIMIT_AUTH_LOGIN_MAX=1`.
2. Tres llamadas a `POST /api/v1/auth/login`:
- llamada 1 con `x-forwarded-for: 1.1.1.1`,
- llamada 2 con `x-forwarded-for: 2.2.2.2`,
- llamada 3 con `x-forwarded-for: 2.2.2.2`.

Resultado observado:
1. `400` (primera IP),
2. `400` (segunda IP cambia clave de limitador),
3. `429` (repeticion de segunda IP).

Conclusión:
- con `TRUST_PROXY=true`, la IP efectiva para rate limit depende de cadena `X-Forwarded-For`; requiere control estricto en borde/proxy.

### Riesgo 3 - Token estatico en endpoints internos

Comando ejecutado:
1. API con `METRICS_TOKEN=m3f1-ops-token`.
2. Validaciones sobre `GET /api/v1/internal/metrics`:
- sin header,
- con token incorrecto,
- con token correcto.

Resultado observado:
1. sin token -> `403`,
2. token incorrecto -> `403`,
3. token correcto -> `200`.

Conclusión:
- control de acceso funciona, pero el modelo sigue siendo secreto estatico; mantener rotacion y custodia en secret manager.
