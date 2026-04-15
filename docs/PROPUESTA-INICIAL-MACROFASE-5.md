# PROPUESTA INICIAL MACROFASE 5 (M5)

## 1) Diagnostico base de entrada

MacroFase 4 deja el MVP funcional cerrado en F1-F5, con:

1. flujo operativo UI/API validado;
2. estandar UX de errores de negocio;
3. trazabilidad E2E por flujo;
4. mitigacion de riesgos residuales (dataset + login integrado + evidencia F5 200).

Conclusion: la plataforma esta en condiciones de pasar de "MVP funcional validado" a "operacion preproductiva controlada".

## 2) Objetivo de MacroFase 5

Preparar salida operativa real con foco en:

1. robustez de operacion diaria;
2. control de calidad de datos y procesos;
3. readiness de despliegue y soporte;
4. evidencia de estabilidad para piloto/produccion.

## 3) Alcance propuesto (M5)

### M5-A: Estabilizacion funcional-operativa

1. cerrar brechas de UX operativa remanente en F1-F5;
2. endurecer validaciones de entrada/salida en endpoints de negocio;
3. normalizar mensajes accionables y estados de error en UI.

### M5-B: Calidad de datos y escenarios operativos

1. dataset operativo versionado para QA/UAT;
2. escenarios de prueba reproducibles (happy path + conflictos + precondiciones + permisos);
3. script de inicializacion/refresh de dataset para ciclos de validacion.

### M5-C: Preparacion de despliegue y soporte

1. baseline de configuracion por entorno (dev/qa/prod);
2. checklist de release candidate (RC) con gates obligatorios;
3. runbook de operacion y contingencia para soporte de primer nivel.

### M5-D: Evidencia de salida para piloto

1. suite E2E de negocio consolidada y ejecutada sobre dataset oficial;
2. smoke funcional UI/API post-despliegue;
3. acta de salida M5 con decision go/no-go para piloto controlado.

## 4) Fuera de alcance (M5)

1. nuevas lineas funcionales fuera de F1-F5;
2. rediseño visual mayor no vinculado a operacion;
3. integraciones externas enterprise no criticas para piloto.

## 5) Secuencia de implementacion recomendada

1. **M5-A1**: inventario final de brechas operativas F1-F5 (backend + UI + docs).
2. **M5-B1**: consolidar dataset operativo versionado y scripts de refresh.
3. **M5-A2**: aplicar correcciones puntuales priorizadas P1.
4. **M5-C1**: cerrar checklist RC y hardening de configuracion por entorno.
5. **M5-D1**: ejecutar bateria E2E + smoke + evidencia de estabilidad.
6. **M5-D2**: acta final M5 con decision de salida a piloto.

## 6) Priorizacion inicial (P1/P2/P3)

- **P1**
1. estabilidad F1-F5 en escenarios operativos reales;
2. dataset de validacion reproducible y mantenible;
3. gates de salida RC con evidencia automatizada.

- **P2**
1. mejoras de productividad operativa en UI (flujo, feedback, tiempos de accion);
2. refinamiento de runbooks y soporte.

- **P3**
1. optimizaciones no bloqueantes de ergonomia y reporting.

## 7) Criterio de salida MacroFase 5

M5 se considera cerrada si se cumplen todos:

1. suite E2E funcional de negocio en verde sobre dataset oficial;
2. smoke UI/API post-despliegue en verde;
3. checklist RC completo sin bloqueantes abiertos;
4. runbook operativo y contingencia validados;
5. acta de cierre M5 con riesgos residuales y plan de control.

## 8) Riesgos principales de M5

1. deriva de alcance hacia nuevas funcionalidades no MVP;
2. inconsistencia entre dataset de prueba y comportamiento real operativo;
3. regresiones por cambios puntuales sin cobertura automatizada suficiente.

Mitigacion:

1. control estricto por bloques cerrados y criterio de salida;
2. dataset versionado con escenarios controlados;
3. gate tecnico obligatorio: `lint + typecheck + tests + build` antes de cierre de bloque.

## 9) Plan de arranque inmediato (M5-S1)

### Sprint M5-S1 (recomendado)

1. **M5-A1-01**: matriz de brechas operativas F1-F5 (severidad, impacto, accion).
2. **M5-B1-01**: especificacion de dataset operativo oficial (casos y objetivos de validacion).
3. **M5-B1-02**: script/documento de refresh de dataset para QA/UAT.
4. **M5-C1-01**: checklist RC v1 con evidencias minimas exigidas.

### Evidencia minima de cierre de sprint

1. matriz de brechas aprobada;
2. dataset oficial definido y ejecutable;
3. checklist RC publicado;
4. registro de avance en acta M5.
