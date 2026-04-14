# M3-E5 - Verificacion E2E UI/API

## Objetivo

Validar extremo a extremo el flujo operativo del dashboard M3-E5 sobre API interna:

1. ejecutar acciones (`acknowledge`, `silence`, `unsilence`) desde UI,
2. confirmar persistencia en timeline (acciones y eventos),
3. asegurar que no hay regresion tecnica en build/typecheck/test.

## Precondiciones

1. Infra local levantada:
- `pnpm docker:up`

2. API en ejecucion (Terminal A):
- variables de entorno configuradas,
- `pnpm.cmd --filter @pac/api dev`

3. Web en ejecucion (Terminal B):
- `pnpm.cmd --filter @pac/web dev`

4. Si aplica hardening de endpoint interno:
- tener `x-metrics-token` disponible.

## Criterios de verificacion (aceptacion)

## C1 - Dashboard operativo carga correctamente

PASS:
1. UI abre en `http://localhost:5173` (o puerto asignado por Vite).
2. Secciones visibles:
- Estado de alertas,
- Snapshot de metricas,
- Acciones operativas M3-E5,
- Timeline operativo,
- Tendencias 24h/7d.

FAIL:
- error de carga, panel vacio o fetch fallido sin recuperacion.

## C2 - Acciones operativas desde UI

PASS:
1. `Acknowledge` responde sin error y muestra feedback.
2. `Silence` responde sin error y actualiza estado de regla (`isSilenced`).
3. `Unsilence` responde sin error y revierte estado.

FAIL:
- accion no ejecuta, responde error o no cambia estado esperado.

## C3 - Timeline sincronizado

PASS:
1. tabla de acciones incluye `ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`.
2. tabla de eventos incluye `ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`.
3. filtro por regla y paginacion funcionan sin errores.

FAIL:
- no aparecen registros nuevos o se rompe paginacion/filtro.

## C4 - Regresion tecnica

PASS:
1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.
3. `pnpm.cmd --filter @pac/api test:e2e` -> OK.

FAIL:
- cualquier error de compilacion o pruebas.

## Ejecucion recomendada (paso a paso)

## Paso 1 - Validacion tecnica base

```bash
pnpm.cmd --filter @pac/web typecheck
pnpm.cmd --filter @pac/web build
pnpm.cmd --filter @pac/api test:e2e
```

Resultado esperado:
- todos en verde.

## Paso 2 - Validacion funcional UI

1. Abrir dashboard M3-E5.
2. Ingresar `x-metrics-token` (si aplica) y pulsar `Actualizar`.
3. En panel de acciones:
- seleccionar `error_rate_24h`,
- ejecutar `Acknowledge`,
- ejecutar `Silence` con fecha futura,
- ejecutar `Unsilence`.

Resultado esperado:
- feedback de accion en UI + sin errores de red.

## Paso 3 - Confirmacion API paralela (Terminal C)

```powershell
$BASE="http://localhost:4000"
$TOKEN=""
$headers=@{ "Content-Type"="application/json" }
if ($TOKEN -ne "") { $headers["x-metrics-token"]=$TOKEN }

irm "$BASE/api/v1/internal/alerts/operational/actions?ruleId=error_rate_24h&page=1&pageSize=20" -Headers $headers
irm "$BASE/api/v1/internal/alerts/operational/events?ruleId=error_rate_24h&page=1&pageSize=20" -Headers $headers
```

Resultado esperado:
- acciones recientes del flujo manual en UI,
- eventos recientes del flujo manual en UI.

## Evidencia minima a registrar

1. Captura de dashboard con panel de acciones y timeline visible.
2. Salida de Terminal C con acciones/eventos.
3. Salida de comandos de regresion tecnica.

## Cierre M3-E5 (criterio)

Se declara M3-E5 cerrado cuando:

1. C1, C2, C3 y C4 cumplen en PASS.
2. Evidencia minima queda anexada a acta/documentacion de MacroFase 3.

## Resultado de ejecucion

Fecha: 2026-04-14

Estado:
- C1 PASS
- C2 PASS
- C3 PASS
- C4 PASS

Conclusion:
- validacion E2E UI/API completada.
- evidencia anexada en acta de MacroFase 3.
