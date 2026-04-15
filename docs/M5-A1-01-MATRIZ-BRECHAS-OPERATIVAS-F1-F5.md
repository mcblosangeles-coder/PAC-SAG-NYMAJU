# M5-A1-01 - Matriz de brechas operativas F1-F5

## Objetivo

Identificar brechas operativas reales del baseline MVP (F1-F5), priorizarlas y definir acciones ejecutables para estabilizacion preproductiva.

## Escala de clasificacion

- Severidad: Critica / Alta / Media / Baja
- Prioridad: P1 / P2 / P3

## Matriz de brechas

| ID | Flujo | Brecha operativa | Severidad | Impacto operativo | Accion recomendada | Prioridad | Estado |
|---|---|---|---|---|---|---|---|
| M5-BR-001 | F1 Acceso seguro | Sesion operativa en UI depende de credenciales embebidas de validacion (`admin@pac.local`) y no distingue perfil de entorno QA/PROD. | Media | Riesgo de uso de cuenta no apropiada y trazabilidad debil por entorno. | Implementar selector de perfil de autenticacion por entorno (QA/PROD), con bloqueo de credenciales por defecto en `production`. | P1 | Abierta |
| M5-BR-002 | F1 Acceso seguro | No existe flujo UI para rotacion/refresh visible del access token ni aviso previo de expiracion. | Media | Interrupcion operativa por expiracion de token durante acciones F2-F5. | Incorporar refresh transparente o aviso de expiracion + accion de reautenticacion controlada. | P1 | Abierta |
| M5-BR-003 | F2 Consulta operativa | Bandeja actual funciona por IDs manuales; falta modo operativo de busqueda/filtrado por estado/responsable/codigo. | Alta | Baja productividad y mayor error humano en operacion diaria. | Implementar endpoint/listado operativo y UI de filtros minimos (codigoInterno, estadoGlobal, responsable). | P1 | Abierta |
| M5-BR-004 | F2/F3 Consulta y detalle | No hay mecanismo de reintento controlado en UI para errores transitorios de red/API (`Failed to fetch`, timeout). | Media | Friccion operativa e incidencias manuales repetitivas. | Agregar retry con backoff corto + mensaje accionable con estado de conectividad. | P2 | Abierta |
| M5-BR-005 | F3 Workflow + historial | Historial carece de atajos de diagnostico (filtro por rango temporal y tipo de cambio). | Baja | Analisis operativo mas lento para incidentes y auditoria funcional. | Extender filtros de historial (fecha inicial/final + tipo `GLOBAL/ETAPA`). | P3 | Abierta |
| M5-BR-006 | F4 Cambio de estado | En escenarios `422` se informa causa general, pero no se expone detalle estructurado de bloqueos activos (alerta/NC) en respuesta de accion. | Alta | Operador debe investigar manualmente, aumenta tiempo de resolucion. | Enriquecer respuesta `422` con detalle resumido de bloqueos o endpoint de diagnostico inmediato. | P1 | Abierta |
| M5-BR-007 | F4/F5 Acciones criticas | Falta confirmacion operativa previa (modal/confirm) para acciones criticas en UI. | Media | Riesgo de ejecucion accidental y retrabajo. | Añadir confirmacion explicita antes de `change-state` y `reopen-stage` con resumen de impacto. | P2 | Abierta |
| M5-BR-008 | F5 Reapertura de etapa | Lista de etapas de reapertura es manual; riesgo de usar etapa inexistente y provocar `404` evitable. | Alta | Errores operativos frecuentes en reapertura y ciclos de correccion innecesarios. | Reemplazar input libre por selector dinamico de etapas disponibles del expediente. | P1 | Abierta |
| M5-BR-009 | F1-F5 Dataset operativo | Dataset de validacion existe pero no esta versionado como contrato operativo por escenario (objetivo, precondicion, resultado esperado). | Alta | Inconsistencia entre ciclos QA/UAT y evidencia no comparable entre iteraciones. | Publicar especificacion de dataset oficial M5 (casos, IDs, objetivos, resultado esperado) y script de refresh. | P1 | Abierta |
| M5-BR-010 | F1-F5 Release readiness | Falta checklist RC unificado con evidencia obligatoria por flujo (API/UI/E2E/smoke). | Alta | Riesgo de salida sin control integral de regresion. | Definir y versionar checklist RC M5 con gates y responsables por evidencia. | P1 | Abierta |

## Priorizacion consolidada

### P1 (ejecucion inmediata)

1. M5-BR-001
2. M5-BR-002
3. M5-BR-003
4. M5-BR-006
5. M5-BR-008
6. M5-BR-009
7. M5-BR-010

### P2

1. M5-BR-004
2. M5-BR-007

### P3

1. M5-BR-005

## Secuencia recomendada de cierre de brechas

1. M5-B1-01: cerrar contrato de dataset operativo (mitiga BR-009).
2. M5-B1-02: definir y automatizar refresh de dataset QA/UAT (mitiga BR-009).
3. M5-C1-01: checklist RC v1 con evidencias por flujo (mitiga BR-010).
4. M5-A2-01: hardening UI/API de brechas P1 funcionales (BR-001/002/003/006/008).
5. M5-A2-02: mejoras P2 de resiliencia y confirmacion operativa (BR-004/007).

## Criterio de cierre M5-A1-01

Se considera cerrado cuando:

1. todas las brechas F1-F5 quedan inventariadas y priorizadas;
2. cada brecha tiene accion concreta;
3. existe secuencia de implementacion asociada a bloques M5.

Estado: **IMPLEMENTADO (matriz creada y lista para ejecucion por bloques).**
