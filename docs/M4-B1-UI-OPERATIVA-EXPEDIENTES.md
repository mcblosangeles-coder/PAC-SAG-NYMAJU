# M4-B1 - UI operativa de expedientes (F2-F5)

## Objetivo

Implementar interfaz operativa web para ejecutar flujo de consulta y acciones de expediente sobre endpoints reales de negocio:

- F2 consulta operativa (`GET /expedientes/:id`)
- F3 workflow + historial (`GET /expedientes/:id/workflow`, `GET /expedientes/:id/history`)
- F4 cambio de estado (`POST /expedientes/:id/change-state`)
- F5 reapertura de etapa (`POST /expedientes/:id/reopen-stage`)

## Alcance implementado

1. Bandeja/listado por IDs:
- ingreso manual de IDs de expediente separados por coma,
- carga de resumen por expediente con estado/responsable/bloqueos,
- accion `Abrir` para detalle.

2. Detalle operativo:
- resumen del expediente,
- tabla de workflow por etapas,
- historial de estados con filtro `scope` (`all|global|stage`).

3. Acciones operativas:
- formulario `change-state` (estado objetivo + comentario),
- formulario `reopen-stage` (etapa + motivo),
- feedback de resultado y recarga de detalle/bandeja.

4. Seguridad de consumo API:
- uso de `Authorization: Bearer <accessToken>`,
- persistencia local del token para continuidad operativa,
- login operativo integrado (`email/password`) para obtener token sin pegado manual.

5. Compatibilidad:
- dashboard M3-E5 se mantiene operativo en el mismo frontend.

## Archivos modificados

1. `apps/web/src/App.tsx`
2. `apps/web/src/styles.css`

## Evidencia tecnica

1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.

## Criterio de salida M4-B1

1. La UI permite cargar bandeja y abrir detalle sobre IDs validos.
2. La UI ejecuta `change-state` y `reopen-stage` con feedback de API.
3. La UI muestra historial de estados con filtro de scope.
4. Build/typecheck web en verde.

Estado actual:
- IMPLEMENTADO, VALIDADO TECNICAMENTE Y VALIDADO FUNCIONALMENTE.

## Evidencia de validacion funcional guiada (2026-04-15)

Casos de validacion recomendados:
- `35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431` (`PAC-VERIF-001`) para F5 (`200` esperado en `REVISION_TECNICA`).
- `b84fb315-bf65-40d4-86ff-6e4a52149965` (`PAC-VERIF-002`) para F4 (`422` esperado por bloqueo activo).
- `0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8` (`PAC-VERIF-003`) para recorrido base F2/F3.

Resultados observados:

1. Bandeja + detalle (F2/F3): OK.
2. `change-state` (F4) con `estadoNuevo=APROBADO` sobre `PAC-VERIF-002`:
- respuesta `UNPROCESSABLE_ENTITY` por bloqueos activos (comportamiento esperado de negocio).
3. `reopen-stage` (F5) con `REVISION_TECNICA` sobre `PAC-VERIF-001`:
- camino positivo disponible (`200`) con etapa presembrada en estado reabrible.

Decision de cierre:
- M4-B1 se considera cerrado para objetivo de interfaz operativa y manejo de respuestas de negocio/control de errores.
- Riesgo de dependencia de token manual mitigado con login integrado en UI.
