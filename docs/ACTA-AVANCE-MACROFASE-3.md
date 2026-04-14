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
