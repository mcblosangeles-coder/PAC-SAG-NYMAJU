# M3-E5 - Acciones operativas desde dashboard

## Objetivo

Convertir el dashboard M3-E4 en consola operativa accionable para gestionar alertas:

1. reconocer alerta (`acknowledge`),
2. silenciar alerta temporalmente (`silence`),
3. consultar historial de eventos de alerta.

## Alcance MVP

### 1) Acknowledge por regla

Accion manual de operador sobre una regla activa para registrar gestion inicial.

Campos minimos:
- `ruleId`
- `comment`
- `acknowledgedByUserId` (si hay contexto autenticado) o `operator` tecnico MVP

Efecto esperado:
- no elimina la alerta, solo deja traza de gestion.

### 2) Silence por regla

Silenciar notificaciones de una regla por ventana temporal.

Campos minimos:
- `ruleId`
- `silencedUntil`
- `reason`
- `silencedByUserId` u `operator`

Efecto esperado:
- evaluador sigue calculando brechas, pero no emite notificaciones para regla silenciada hasta `silencedUntil`.

### 3) Historial de eventos de alerta

Registro consultable de transiciones y acciones operativas:
- `triggered`
- `ongoing`
- `resolved`
- `acknowledged`
- `silenced`
- `unsilenced` (manual o por expiracion)

## Diseño técnico recomendado

## Persistencia

Agregar tablas:

1. `operational_alert_actions`
- `id`
- `rule_id`
- `action` (`ACKNOWLEDGE|SILENCE|UNSILENCE`)
- `comment`
- `silenced_until` (nullable)
- `created_by_user_id` (nullable)
- `operator` (nullable)
- `created_at`

2. `operational_alert_events`
- `id`
- `rule_id`
- `event_type` (`TRIGGERED|ONGOING|RESOLVED|ACKNOWLEDGED|SILENCED|UNSILENCED`)
- `severity`
- `metric`
- `value`
- `threshold`
- `payload` (JSON)
- `created_at`

## API interna propuesta

1. `POST /api/v1/internal/alerts/operational/:ruleId/acknowledge`
- body: `{ comment: string, operator?: string }`

2. `POST /api/v1/internal/alerts/operational/:ruleId/silence`
- body: `{ silencedUntil: string, reason: string, operator?: string }`

3. `POST /api/v1/internal/alerts/operational/:ruleId/unsilence`
- body: `{ reason?: string, operator?: string }`

4. `GET /api/v1/internal/alerts/operational/events?ruleId=&page=&pageSize=`
- historial paginado de eventos.

5. `GET /api/v1/internal/alerts/operational/actions?ruleId=&page=&pageSize=`
- historial paginado de acciones de operador.

## UI dashboard propuesta

En cada tarjeta de regla:

1. boton `Acknowledge`,
2. boton `Silence`,
3. indicador `Silenced until ...` cuando aplique,
4. acceso a panel lateral de historial por regla.

## Secuencia de implementación recomendada

1. Modelo Prisma + migración (`actions` + `events`).
2. Servicio backend:
- gestión de silencio por regla,
- registro de eventos automáticos en evaluador M3-E3.
3. Endpoints internos de acciones e historial.
4. Integración UI en `apps/web`:
- botones de acción por regla,
- modal/form para comentario y ventana de silencio.
5. Pruebas:
- unitarias de reglas de silencio,
- e2e de API interna (ack/silence/history),
- smoke visual del dashboard.

## Criterio de salida M3-E5

1. Operador puede ejecutar `acknowledge` y `silence` desde dashboard.
2. Evaluador respeta reglas silenciadas sin perder cálculo de estado.
3. Existe historial consultable de acciones y eventos.
4. Queda traza auditable y operacional completa por regla.

## Riesgos residuales

1. Sin autenticación de operador robusta, `operator` puede ser manual y débil para auditoría.
2. Silencios excesivos pueden ocultar degradación si no hay política de expiración estricta.
3. Requiere disciplina operacional para comentarios de calidad en `acknowledge`.

## Estado de ejecucion

### Paso 1 - schema.prisma + migracion

Completado:

1. `schema.prisma` ampliado con:
- enums `OperationalAlertActionType` y `OperationalAlertEventType`,
- modelos `OperationalAlertAction` y `OperationalAlertEvent`.

2. Migracion generada y aplicada:
- `prisma/migrations/20260414173135_m3_e5_alert_actions_events/migration.sql`.

3. Nota tecnica:
- `prisma generate` presenta bloqueo `EPERM` en `query_engine-windows.dll.node` por archivo en uso.
- accion recomendada para siguiente paso: detener procesos `@pac/api dev` / `@pac/web dev`, ejecutar `pnpm db:generate` y continuar con implementacion backend M3-E5 Paso 2.

### Cierre de comprobacion Paso 1

1. Procesos en conflicto detenidos.
2. `pnpm db:generate` -> OK.
3. `pnpm --filter @pac/api typecheck` -> OK.

Estado final Paso 1:
- VALIDADO.

### Paso 2 - backend acknowledge/silence/unsilence/history

Completado:

1. Endpoints internos implementados:
- `POST /api/v1/internal/alerts/operational/:ruleId/acknowledge`
- `POST /api/v1/internal/alerts/operational/:ruleId/silence`
- `POST /api/v1/internal/alerts/operational/:ruleId/unsilence`
- `GET /api/v1/internal/alerts/operational/actions`
- `GET /api/v1/internal/alerts/operational/events`

2. Validacion tecnica:
- `pnpm.cmd --filter @pac/api typecheck` -> OK.
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (`38/38`).

3. Validacion funcional manual:
- ciclo completo `acknowledge -> silence -> unsilence` ejecutado por API interna.
- historial de acciones y eventos confirma persistencia.

Estado final Paso 2:
- VALIDADO.

### Paso 3 - UI dashboard (acciones operativas + timeline)

Completado:

1. Dashboard `apps/web` actualizado a M3-E5:
- panel de acciones operativas con formulario:
  - `acknowledge` (comment + operator),
  - `silence` (reason + silencedUntil + operator),
  - `unsilence` (reason + operator).
- selector de regla operativo.

2. Timeline operativo integrado:
- tabla de historial de acciones.
- tabla de historial de eventos.
- filtro por `ruleId` + paginacion.

3. Estado por regla enriquecido:
- visualizacion de `isSilenced` y `silencedUntil`.

4. Validacion tecnica:
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.
- regresion backend mantenida (`pnpm.cmd --filter @pac/api test:e2e` -> OK `38/38`).

Estado final Paso 3:
- IMPLEMENTADO (pendiente cierre de validacion funcional visual UI/API E2E en entorno local).

### Cierre funcional final M3-E5 (UI/API E2E)

Fecha cierre: 2026-04-14

Resultado de validacion final:

1. Validacion visual UI (navegador):
- panel `Acciones Operativas de Alertas (M3-E5)` visible y operativo.
- panel `Timeline Operativo de Alertas` visible.

2. Ejecucion funcional completa en UI:
- `Acknowledge` ejecutado.
- `Silence` ejecutado.
- `Unsilence` ejecutado.

3. Persistencia confirmada:
- timeline de acciones con `ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`.
- timeline de eventos con `ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`.

4. Regresion tecnica mantenida:
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (`38/38`).

Estado final M3-E5:
- VALIDADO Y CERRADO FORMALMENTE.
