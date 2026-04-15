# M5-C1-01 - Checklist RC v1 (gates obligatorios F1-F5)

## Objetivo

Definir el checklist de salida a Release Candidate (RC) con gates tecnicos y funcionales obligatorios para evitar regresiones del MVP.

## Regla de uso

Un RC se considera **aprobado** solo si todos los gates P1 estan en estado `PASS`.

## Gate 0 - Precondiciones de entorno (P1)

| ID | Control | Evidencia requerida | Estado |
|---|---|---|---|
| RC-00-01 | Docker/servicios base activos (`postgres`, `redis`) | `docker ps` con contenedores healthy | [ ] |
| RC-00-02 | Variables criticas de API definidas | log de arranque API sin errores de env | [ ] |
| RC-00-03 | CORS permitido para puerto real de web (`5173/5174`) | carga UI sin `Failed to fetch` | [ ] |

## Gate 1 - Integridad de datos QA/UAT (P1)

| ID | Control | Evidencia requerida | Estado |
|---|---|---|---|
| RC-01-01 | Refresh dataset estandar ejecutado | comando `pnpm dataset:refresh` en verde | [ ] |
| RC-01-02 | IDs oficiales disponibles en resumen F2 | `GET /expedientes/:id` 200 para DS-01/02/03 | [ ] |
| RC-01-03 | Caso DS-01 F5 positivo disponible | `POST /reopen-stage` 200 (`CERRADA -> REABIERTA`) | [ ] |
| RC-01-04 | Caso DS-02 F4 bloqueado disponible | `POST /change-state` 422 por bloqueo activo | [ ] |

## Gate 2 - Calidad tecnica de build y codigo (P1)

| ID | Control | Evidencia requerida | Estado |
|---|---|---|---|
| RC-02-01 | Lint monorepo | `pnpm lint` en verde | [ ] |
| RC-02-02 | Typecheck API | `pnpm --filter @pac/api typecheck` en verde | [ ] |
| RC-02-03 | Typecheck Web | `pnpm --filter @pac/web typecheck` en verde | [ ] |
| RC-02-04 | E2E API | `pnpm --filter @pac/api test:e2e` en verde | [ ] |
| RC-02-05 | Build Web | `pnpm --filter @pac/web build` en verde | [ ] |

## Gate 3 - Evidencia funcional por flujo F1-F5 (P1)

| Flujo | Escenario minimo obligatorio | Resultado esperado | Evidencia |
|---|---|---|---|
| F1 | Login valido + `auth/me` | `200` en login y `200` en me | [ ] |
| F1 | Token invalido o expirado | `401 UNAUTHENTICATED` | [ ] |
| F2 | Consulta resumen expediente valido | `200` | [ ] |
| F3 | Workflow + historial expediente valido | `200` + datos consistentes | [ ] |
| F4 | `change-state` con bloqueo activo (DS-02) | `422 UNPROCESSABLE_ENTITY` | [ ] |
| F4 | `change-state` transicion invalida | `409 CONFLICT` | [ ] |
| F5 | `reopen-stage` positivo (DS-01) | `200` | [ ] |
| F5 | `reopen-stage` etapa inexistente | `404 NOT_FOUND` | [ ] |

## Gate 4 - Observabilidad y operacion (P2)

| ID | Control | Evidencia requerida | Estado |
|---|---|---|---|
| RC-04-01 | Dashboard operativo accesible | UI M3-E5 carga sin error | [ ] |
| RC-04-02 | Alertas operativas consultables | endpoint `/internal/alerts/operational` responde 200 | [ ] |
| RC-04-03 | Acciones operativas auditables | `/actions` y `/events` reflejan operaciones recientes | [ ] |

## Gate 5 - Documentacion y handoff (P1)

| ID | Control | Evidencia requerida | Estado |
|---|---|---|---|
| RC-05-01 | Contrato API vigente | `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md` actualizado | [ ] |
| RC-05-02 | Runbook operativo vigente | `docs/M4-C1-RUNBOOK-OPERACION-MVP.md` actualizado | [ ] |
| RC-05-03 | Dataset oficial vigente | `docs/M5-B1-01-DATASET-OPERATIVO-OFICIAL.md` | [ ] |
| RC-05-04 | Estandar refresh vigente | `docs/M5-B1-02-REFRESH-DATASET-QA-UAT.md` | [ ] |

## Gate 6 - Decision RC (P1)

| ID | Criterio | Resultado |
|---|---|---|
| RC-06-01 | Todos los gates P1 en `PASS` | [ ] PASS / [ ] FAIL |
| RC-06-02 | Riesgos abiertos no bloqueantes documentados | [ ] PASS / [ ] FAIL |
| RC-06-03 | Acta de decision RC emitida | [ ] PASS / [ ] FAIL |

## Plantilla de evidencia por corrida RC

1. Fecha/hora:
2. Commit/branch:
3. Entorno (`local/qa`):
4. Resultado Gate 0:
5. Resultado Gate 1:
6. Resultado Gate 2:
7. Resultado Gate 3:
8. Resultado Gate 4:
9. Resultado Gate 5:
10. Decision Gate 6:
11. Riesgos residuales:
12. Responsable aprobacion:

## Criterio de cierre M5-C1-01

1. checklist RC v1 publicado y versionado;
2. gates P1/P2 definidos;
3. evidencia minima por flujo F1-F5 definida;
4. plantilla de decision RC disponible.

Estado: **IMPLEMENTADO**.
