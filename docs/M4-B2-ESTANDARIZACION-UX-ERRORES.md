# M4-B2 - Estandarizacion UX de errores (409/422/404)

## Objetivo

Mejorar la claridad operativa de errores de negocio en UI para reducir ambiguedad y acelerar resolucion por usuario.

## Alcance aplicado

Se implementa mapeo de errores API a mensajes accionables por contexto de uso:

1. Contexto bandeja/detalle de expedientes.
2. Accion `change-state`.
3. Accion `reopen-stage`.

## Reglas UX implementadas

1. `404 NOT_FOUND`
- bandeja/detalle: "Expediente no encontrado. Verifique ID activo."
- `reopen-stage`: "Etapa no existe en expediente. Revisar tabla de workflow."

2. `409 CONFLICT`
- `change-state`: transicion invalida, revisar secuencia de workflow.
- `reopen-stage`: reapertura invalida por estado fuente.

3. `422 UNPROCESSABLE_ENTITY`
- precondiciones no cumplidas; revisar bloqueos activos (alertas/NC).

4. `401/403`
- mensajes directos para renovacion de token o verificacion de permisos.

## Implementacion tecnica

Archivo principal:
- `apps/web/src/App.tsx`

Cambios:
1. parser estructurado de error API (`status`, `code`, `message`).
2. mapeo `toActionableApiError(...)` por codigo + contexto.
3. propagacion de contexto en:
- carga de inbox,
- carga de detalle,
- acciones `change-state` y `reopen-stage`.

## Evidencia tecnica

1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.

## Estado

- M4-B2: IMPLEMENTADO Y VALIDADO TECNICAMENTE.
