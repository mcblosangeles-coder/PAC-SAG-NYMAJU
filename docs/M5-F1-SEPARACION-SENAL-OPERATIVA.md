# M5-F1 - Endurecimiento de lectura operativa (señal operacional vs validación)

## Fecha
2026-04-15

## Objetivo
Separar la señal de monitoreo para que el histórico de alertas operativas no mezcle tráfico de pruebas/validación con tráfico operacional real.

## Cambios implementados

1. Perfilado de tráfico HTTP en API:
- Header soportado: `x-traffic-profile` con valores `operational|validation`.
- Fallback:
  - `NODE_ENV=test` -> `validation`
  - otros entornos -> `operational`

2. Métricas en memoria separadas por perfil:
- `all`
- `operational`
- `validation`

3. Persistencia histórica separada por fuente:
- `api_internal_all`
- `api_internal_operational`
- `api_internal_validation`

4. Endpoints internos con parámetro `profile`:
- `GET /internal/metrics?profile=...`
- `GET /internal/metrics/history?window=...&profile=...`
- `GET /internal/alerts/operational?profile=...`
- `POST /internal/alerts/operational/evaluate?profile=...`

5. Evaluador de alertas:
- Evalúa por perfil (default `operational`).
- Estado expone `profile` utilizado en última evaluación.

6. Suite E2E:
- Toda request e2e envía `x-traffic-profile: validation` automáticamente.
- Evita contaminar histórico operacional durante pruebas.

## Validación técnica ejecutada

1. `pnpm.cmd --filter @pac/api typecheck` -> OK
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`45/45`)
3. Verificación de logs e2e:
- tráfico etiquetado como `"trafficProfile":"validation"` en requests de prueba.
4. Cobertura e2e nueva para `profile`:
- `400` para `profile` inválido.
- `200` para `profile=validation`.

## Resultado
M5-F1 queda implementado y validado técnicamente: la lectura operativa puede enfocarse en señal `operational` y mantener `validation` aislada para QA/UAT.
