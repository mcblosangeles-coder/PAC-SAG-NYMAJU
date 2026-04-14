# BACKLOG M3 FUNCIONAL

## Fecha
2026-04-13

## Objetivo del backlog

Definir y priorizar actividades funcionales de MacroFase 3 para ejecutar verticales de negocio sobre la base tecnica validada en MacroFase 2.

## Prioridad y convenciones

- Prioridad: `P1` (critica), `P2` (alta), `P3` (media).
- Estado inicial: `Pendiente`.
- Criterio de cierre: historia con evidencias (codigo + pruebas + acta).

## Backlog priorizado

| ID | Prioridad | Historia / Actividad | Resultado esperado | Dependencias | Estado |
|---|---|---|---|---|---|
| M3-A1-01 | P1 | Definir contrato API de consulta operativa de expediente | Endpoint y payload estables para consumo UI/operacion | MF2 cerrada | Pendiente |
| M3-A1-02 | P1 | Implementar endpoint de consulta operativa de expediente | Respuesta consolidada con datos de expediente, etapas y bloqueos | M3-A1-01 | Pendiente |
| M3-A1-03 | P1 | Completar reglas de transicion de workflow faltantes | Reglas de dominio completas con errores 409/422 consistentes | M3-A1-02 | Pendiente |
| M3-A1-04 | P1 | Exponer historial de estado de expediente | Endpoint de historial con filtros basicos y paginacion inicial | M3-A1-02 | Pendiente |
| M3-A1-08 | P1 | Definir CI minimo con quality gates | Pipeline en PR con typecheck, unit, e2e, preflight | M3-A1-02, M3-A1-07 | Pendiente |
| M3-A1-05 | P2 | Exponer trazabilidad/auditoria por expediente | Consulta de auditoria por entidad y rango temporal | M3-A1-04 | Pendiente |
| M3-A1-06 | P2 | Endurecer seguridad de sesion (refresh token persistente) | Rotacion/revocacion de refresh token operativa | M3-A1-02 | Pendiente |
| M3-A1-07 | P2 | Endurecer `/auth/logout` y `/auth/refresh` con auditoria | Eventos de seguridad auditados y testeados | M3-A1-06 | Pendiente |
| M3-A1-09 | P2 | Estandarizar logging estructurado API | Correlacion basica de eventos operativos y de error | M3-A1-02 | Pendiente |
| M3-A1-10 | P3 | Extender smoke/preflight con chequeos de negocio | Pre-check incluye endpoint funcional principal | M3-A1-02, M3-A1-08 | Pendiente |

## Actividades inmediatas (sprint de arranque)

### Sprint 1 (recomendado)

1. M3-A1-01: definir contrato API de consulta operativa de expediente.
2. M3-A1-02: implementar endpoint de consulta operativa.
3. M3-A1-03: implementar base de reglas faltantes de workflow.
4. M3-A1-08: iniciar CI minimo con quality gates sobre el primer endpoint funcional.

### Sprint 2 (recomendado)

1. M3-A1-03: cierre completo de reglas de workflow y casos invalidos.
2. M3-A1-04: publicar historial de estado.

## Criterios de aceptacion globales para M3-A1

1. Contratos API documentados y consistentes con `code + message` en errores.
2. Cobertura minima por historia: unit/e2e en verde.
3. `pnpm preflight:local` en PASS al cierre de cada hito P1.
4. Evidencia registrada en acta de avance de MacroFase 3.

## Definicion de cierre por historia (DoD minimo)

Cada historia del backlog se considera cerrada solo si cumple:

1. Contrato documentado (request/response/errores) cuando aplique.
2. Implementacion en codigo con cambios trazables.
3. Pruebas minimas asociadas:
- unitarias para reglas/utilidades,
- e2e para comportamiento API.
4. Evidencia tecnica ejecutada:
- `pnpm --filter @pac/api typecheck` en OK.
- suite de pruebas relacionada en verde.
5. Registro en `ACTA-AVANCE-MACROFASE-3.md` con:
- actividad cerrada,
- evidencia,
- siguiente punto.

## Paralelizacion recomendada

1. M3-A1-03 puede iniciar en paralelo parcial con M3-A1-02 despues de cerrar M3-A1-01.
2. M3-A1-08 (CI) puede iniciar en paralelo desde que M3-A1-02 tenga endpoint funcional base.
3. M3-A1-09 (logging) puede iniciar en paralelo desde M3-A1-02.
