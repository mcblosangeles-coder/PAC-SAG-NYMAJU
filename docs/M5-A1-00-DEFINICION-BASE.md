# M5-A1-00 - Definicion base de M5-A1 (objetivo, alcance, salida y backlog)

## Fecha
2026-04-15

## 1) Objetivo de M5-A1

Establecer una linea base ejecutable de estabilizacion preproductiva para F1-F5, con foco en:

1. cerrar brechas operativas de mayor impacto;
2. asegurar consistencia de datos QA/UAT;
3. definir gates de salida objetivos para release candidate.

## 2) Alcance M5-A1

### En alcance

1. inventario y priorizacion de brechas operativas F1-F5;
2. definicion del dataset operativo oficial y refresh reproducible;
3. definicion de checklist RC v1 con evidencia minima obligatoria;
4. plan de implementacion backend/UI para brechas P1.

### Fuera de alcance

1. nuevas funcionalidades fuera de F1-F5;
2. rediseño visual mayor no vinculado a operacion;
3. integraciones externas no criticas para salida de piloto.

## 3) Criterios de salida M5-A1

M5-A1 se considera cerrado cuando:

1. existe matriz de brechas F1-F5 priorizada y trazable;
2. existe dataset operativo oficial versionado y refresh estandar;
3. existe checklist RC v1 con gates de decision PASS/FAIL;
4. existe plan de cambios backend/UI para brechas P1;
5. todo lo anterior esta registrado en acta de avance M5.

## 4) Backlog priorizado de implementacion (M5-A1)

### P1 (ejecucion inmediata)

1. `M5-BR-001` perfil de autenticacion por entorno.
2. `M5-BR-002` manejo de expiracion/refresh de sesion.
3. `M5-BR-003` bandeja operativa con filtros.
4. `M5-BR-006` detalle estructurado de bloqueos en `422`.
5. `M5-BR-008` selector dinamico de etapas reabribles.
6. `M5-BR-009` dataset operativo oficial versionado.
7. `M5-BR-010` checklist RC con evidencia obligatoria.

### P2

1. `M5-BR-004` retry de red/API con backoff.
2. `M5-BR-007` confirmacion previa para acciones criticas.

### P3

1. `M5-BR-005` filtros avanzados de historial.

## 5) Secuencia de ejecucion recomendada

1. Cerrar base operativa de datos (`M5-B1-01`, `M5-B1-02`).
2. Cerrar gates de salida (`M5-C1-01`).
3. Implementar cambios funcionales P1 (`M5-A2-01` -> `M5-A2-02`).
4. Ejecutar evidencia E2E + smoke para decision de salida M5.

## 6) Trazabilidad documental asociada

1. `docs/PROPUESTA-INICIAL-MACROFASE-5.md`
2. `docs/M5-A1-01-MATRIZ-BRECHAS-OPERATIVAS-F1-F5.md`
3. `docs/M5-B1-01-DATASET-OPERATIVO-OFICIAL.md`
4. `docs/M5-B1-02-REFRESH-DATASET-QA-UAT.md`
5. `docs/M5-C1-01-CHECKLIST-RC-V1.md`
6. `docs/M5-A2-01-PLAN-CAMBIOS-BACKEND-UI.md`

Estado: **M5-A1 INICIADO Y BASE DEFINIDA**.
