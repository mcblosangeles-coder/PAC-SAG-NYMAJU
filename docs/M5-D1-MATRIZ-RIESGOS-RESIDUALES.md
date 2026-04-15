# M5-D1 - Matriz de Riesgos Residuales

## Fecha
2026-04-15

## Criterio

1. Riesgo bloqueante: impide salida RC.
2. Riesgo no bloqueante: permite salida controlada con seguimiento.

## Matriz

| ID | Riesgo residual | Tipo | Impacto | Probabilidad | Nivel | Mitigacion activa | Dueno | Fecha objetivo |
|---|---|---|---|---|---|---|---|---|
| M5D1-R01 | Desalineacion de dataset QA/UAT respecto al baseline funcional | No bloqueante | Alto | Media | Alto | Ejecutar `pnpm dataset:refresh` antes de cada corrida RC y registrar hash/fecha de corrida | Lider QA | 2026-04-18 |
| M5D1-R02 | Uso de credenciales no acordes al perfil (`QA/PROD`) en validacion operativa | No bloqueante | Medio | Media | Medio | Aplicar politica de perfiles en runbook + verificacion previa de entorno antes de login | Lider Operaciones | 2026-04-18 |
| M5D1-R03 | Degradacion silenciosa de observabilidad por no revisar alertas internas periodicamente | No bloqueante | Medio | Baja | Bajo | Revisión diaria de `/internal/metrics` y `/internal/alerts/operational` con registro en bitacora | Lider Soporte | 2026-04-19 |

## Resultado de clasificacion

1. Riesgos bloqueantes: `0`.
2. Riesgos no bloqueantes: `3`.
3. Salida RC permitida bajo seguimiento de mitigaciones.

## Estado

**APROBADA** para uso de cierre M5-D1.
