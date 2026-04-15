# M4-A2-01 - Ajustes backend y preparacion E2E (F1-F5)

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

