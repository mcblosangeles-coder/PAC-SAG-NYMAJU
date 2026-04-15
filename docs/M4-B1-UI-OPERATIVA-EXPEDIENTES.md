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
- en validacion guiada actual predominan respuestas `CONFLICT` por estado no reabrible de etapa.

Decision de cierre:
- M4-B1 se considera cerrado para objetivo de interfaz operativa y manejo de respuestas de negocio/control de errores.
- Riesgo de dependencia de token manual mitigado con login integrado en UI.

## Pendiente no bloqueante (mitigacion sin frenar)

ID: `PNB-M4-B1-F5-200`

1. Pendiente formal:
- falta evidencia funcional de camino positivo `200` para F5 (`reopen-stage`) en entorno local actual.

2. Dueno:
- `Owner`: Backend/Data (responsable de seed operativo de validacion).

3. Fecha objetivo:
- `Due date`: 2026-04-16.

4. Plan de mitigacion:
- crear 1 expediente semilla con al menos una etapa en estado reabrible (`CERRADA|OBSERVADA|BLOQUEADA|VENCIDA|RECHAZADA`),
- ejecutar 1 prueba dirigida F5 (`POST /expedientes/:id/reopen-stage`) con respuesta esperada `200`,
- anexar evidencia (captura UI + salida API) en acta.

5. Criterio de cierre del pendiente:
- evidencia de `200` registrada y verificada,
- acta actualizada marcando `PNB-M4-B1-F5-200` como `CERRADO`,
- sin reabrir el bloque M4-B1 completo.
