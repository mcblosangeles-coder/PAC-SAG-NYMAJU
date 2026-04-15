# M4-A2-01 - Ajustes backend y preparacion E2E (F1-F5)

## Reinicio operativo post-congelamiento contractual (2026-04-15)

Se reabre M4-A2-01 en modalidad iterativa para ejecutar sobre el contrato
congelado en M4-A1-02 (baseline consolidado `0133753`).

### Alcance de esta iteracion

1. Validar que backend actual siga cumpliendo contrato congelado F1-F5.
2. Identificar ajustes estrictamente necesarios en API/UI derivados del contrato actualizado.
3. Ejecutar evidencia tecnica final de esta iteracion (`typecheck`, `e2e`, `build web`) antes de cierre.

### Criterio de salida de esta iteracion

1. Cero brechas funcionales bloqueantes entre contrato congelado y backend real.
2. Brechas documentales o UX menores clasificadas y trazadas.
3. Evidencia tecnica en verde y acta actualizada.

### Evidencia tecnica ejecutada (iteracion 2026-04-15)

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`43/43`).
3. `pnpm.cmd --filter @pac/web build` -> OK.

### Resultado de iteracion

1. Sin brechas funcionales bloqueantes abiertas.
2. Contrato M4-A1-02 utilizado como baseline unico.
3. Iteracion post-congelamiento de M4-A2-01: CERRADA Y VALIDADA.

## Objetivo

Cerrar brechas puntuales de contrato en backend y dejar evidencia de pruebas E2E de negocio sobre baseline F1-F5.

## Ajustes aplicados

1. Semantica de `/auth/me` corregida para caso usuario no encontrado:
- antes: `404` con `code=UNAUTHENTICATED`.
- ahora: `404` con `code=NOT_FOUND`.

2. Contrato actualizado en documento M4-A1-02 para reflejar semantica final.

## Cobertura E2E de negocio preparada

Flujos cubiertos en suite e2e:

1. F1 acceso seguro:
- login payload invalido (`400 INVALID_PAYLOAD`),
- `auth/me` sin token (`401 UNAUTHENTICATED`),
- `auth/me` token mal formado (`401 UNAUTHENTICATED`),
- `auth/me` usuario inexistente (`404 NOT_FOUND`),
- refresh token invalido (`401 UNAUTHENTICATED`).

2. F2 consulta operativa:
- `GET /expedientes/:id` en `200/400/403/404`.

3. F3 workflow + historial:
- `GET /expedientes/:id/workflow` en `200/403/404`,
- `GET /expedientes/:id/history` en `200/400/404`.

4. F4 cambio de estado:
- `POST /expedientes/:id/change-state` en `200/409/422`.

5. F5 reapertura de etapa:
- `POST /expedientes/:id/reopen-stage` en `200/409/500`.

## Criterio de salida M4-A2-01

1. Backend alineado con contrato documentado para F1-F5.
2. E2E de negocio en verde.
3. Acta de MacroFase 4 actualizada con evidencia.
