# M4-D1-01 - Matriz de trazabilidad E2E MVP (F1-F5)

## Objetivo

Trazar de forma verificable los flujos criticos MVP (F1-F5) contra escenarios E2E y criterios de salida para gate funcional de MacroFase 4.

## Fuente de pruebas

- `apps/api/src/__tests__/auth-rbac.e2e.test.ts`
- `apps/api/src/__tests__/auth-sessions.e2e.test.ts`

## Matriz de trazabilidad

| Flujo | Endpoint(s) | Escenario de negocio | Estado esperado | Evidencia E2E |
|---|---|---|---|---|
| F1 Acceso seguro | `POST /auth/login` | Login con payload invalido | `400 INVALID_PAYLOAD` | `returns INVALID_PAYLOAD code on auth login invalid payload` |
| F1 Acceso seguro | `GET /auth/me` | Sin token | `401 UNAUTHENTICATED` | `returns UNAUTHENTICATED on auth me without token` |
| F1 Acceso seguro | `GET /auth/me` | Token mal formado (sin `sub`) | `401 UNAUTHENTICATED` | `returns UNAUTHENTICATED on auth me with malformed payload token` |
| F1 Acceso seguro | `GET /auth/me` | Usuario del token no existe | `404 NOT_FOUND` | `returns NOT_FOUND on auth me when token user does not exist` |
| F1 Acceso seguro | `POST /auth/refresh` | Refresh invalido | `401 UNAUTHENTICATED` | `returns UNAUTHENTICATED on auth refresh with invalid token` |
| F1 Acceso seguro | `POST /auth/refresh` | Reuso de refresh (replay) | `401 UNAUTHENTICATED` + revocacion familia | `rotates refresh token, detects replay and revokes token family` |
| F1 Acceso seguro | `POST /auth/logout` | Logout idempotente y refresh revocado | `204` y luego `401` al refrescar | `logout is idempotent and revoked refresh cannot be used again` |
| F2 Consulta operativa | `GET /expedientes/:id` | Consulta valida | `200` | `returns 200 for operational summary endpoint with valid token and granted permission` |
| F2 Consulta operativa | `GET /expedientes/:id` | ID invalido | `400 INVALID_PARAM` | `returns 400 for operational summary endpoint when expediente id is invalid` |
| F2 Consulta operativa | `GET /expedientes/:id` | Scope denegado | `403 FORBIDDEN` | `returns 403 for operational summary endpoint when scope policy denies access` |
| F2 Consulta operativa | `GET /expedientes/:id` | Expediente inexistente | `404 NOT_FOUND` | `returns 404 for operational summary endpoint when expediente is not found` |
| F3 Workflow + historial | `GET /expedientes/:id/workflow` | Lectura valida | `200` | `returns 200 with valid token and granted permission` |
| F3 Workflow + historial | `GET /expedientes/:id/workflow` | Sin token | `401 UNAUTHENTICATED` | `returns 401 without bearer token` |
| F3 Workflow + historial | `GET /expedientes/:id/workflow` | Scope denegado | `403 FORBIDDEN` | `returns 403 when scope policy denies access to expediente` |
| F3 Workflow + historial | `GET /expedientes/:id/workflow` | Expediente inexistente | `404 NOT_FOUND` | `returns 404 when workflow service reports expediente not found` |
| F3 Workflow + historial | `GET /expedientes/:id/history` | Historial valido | `200` | `returns 200 for state history endpoint with valid token and granted permission` |
| F3 Workflow + historial | `GET /expedientes/:id/history` | Query invalida | `400 INVALID_PARAM` | `returns 400 for state history endpoint when query params are invalid` |
| F3 Workflow + historial | `GET /expedientes/:id/history` | Expediente inexistente | `404 NOT_FOUND` | `returns 404 for state history endpoint when expediente is not found` |
| F4 Cambio de estado | `POST /expedientes/:id/change-state` | Cambio valido | `200` | `returns 200 for change-state real endpoint` |
| F4 Cambio de estado | `POST /expedientes/:id/change-state` | Transicion invalida | `409 CONFLICT` | `returns 409 when change-state transition is invalid` |
| F4 Cambio de estado | `POST /expedientes/:id/change-state` | Precondiciones no cumplidas | `422 UNPROCESSABLE_ENTITY` | `returns 422 when change-state preconditions are not met` |
| F5 Reapertura etapa | `POST /expedientes/:id/reopen-stage` | Reapertura valida | `200` | `returns 200 for reopen-stage real endpoint` |
| F5 Reapertura etapa | `POST /expedientes/:id/reopen-stage` | Transicion invalida | `409 CONFLICT` | `returns 409 when reopen-stage transition is invalid` |
| F5 Reapertura etapa | `POST /expedientes/:id/reopen-stage` | Error inesperado de servicio | `500 INTERNAL_ERROR` | `returns 500 when reopen-stage service fails unexpectedly` |

## Criterio de salida MVP (gate funcional M4-D1)

Se considera superado el gate funcional cuando:

1. Todas las pruebas E2E asociadas a F1-F5 estan en verde.
2. No existen fallos en estados criticos (`401/403/409/422/500`) fuera de los escenarios esperados.
3. Los codigos API (`code + message`) se mantienen consistentes con contrato M4-A1-02.
4. `pnpm.cmd --filter @pac/api test:e2e` reporta `fail=0`.

## Estado actual

- Baseline actual: `39/39` E2E en verde.
- M4-D1-01: MATRIZ CREADA Y LISTA PARA VALIDACION.
