# ACTA DE AVANCE - MACROFASE 5

## Fecha
2026-04-15

## Estado general

- MacroFase 5: INICIADA
- Bloque de arranque: M5-A1 / M5-B1 / M5-C1 (planificacion base)

## Hito de inicio M5

Se aprueba inicio formal de MacroFase 5 con enfoque en estabilizacion preproductiva y salida a piloto controlado.

## Inicio formal M5-A1 (definicion de base)

Se ejecuta inicio formal de M5-A1 con definicion explicita de:

1. objetivo de bloque,
2. alcance en/fuera,
3. criterios de salida,
4. backlog priorizado P1/P2/P3.

### Entregable

1. `docs/M5-A1-00-DEFINICION-BASE.md`

### Estado

- M5-A1: **INICIADO Y DOCUMENTADO**.

### Documento rector aprobado

1. `docs/PROPUESTA-INICIAL-MACROFASE-5.md`

### Decision de direccion

1. Mantener alcance funcional anclado en F1-F5.
2. Priorizar robustez operativa, calidad de datos y readiness de release candidate.
3. Exigir evidencia objetiva por bloque antes de avanzar de fase.

## Entregables de arranque comprometidos (M5-S1)

1. `M5-A1-01`: matriz de brechas operativas F1-F5.
2. `M5-B1-01`: especificacion de dataset operativo oficial.
3. `M5-B1-02`: flujo/script de refresh dataset QA/UAT.
4. `M5-C1-01`: checklist RC v1 con gates y evidencia.

## Criterio de control de avance M5

1. Ningun bloque se cierra sin evidencia tecnica ejecutada.
2. Cambios de alcance deben quedar explicitamente aprobados en acta.
3. Cada iteracion debe registrar riesgos, mitigacion y siguiente paso.

## Siguiente punto

Ejecutar `M5-A1-01`: construir matriz de brechas operativas F1-F5 (severidad, impacto, accion y prioridad).

## Actualizacion M5-A1-01 (matriz de brechas operativas F1-F5)

Se ejecuta inventario estructurado de brechas operativas sobre el baseline F1-F5.

### Entregable

1. `docs/M5-A1-01-MATRIZ-BRECHAS-OPERATIVAS-F1-F5.md`

### Resultado

1. Brechas identificadas y priorizadas por severidad/impacto/accion/prioridad.
2. Priorizacion consolidada P1/P2/P3 definida para ejecucion por bloques.
3. Secuencia recomendada de cierre enlazada a M5-B1, M5-C1 y M5-A2.

Estado:

- M5-A1-01: **IMPLEMENTADO**.

## Siguiente punto

Ejecutar `M5-B1-01`: especificacion formal de dataset operativo oficial (casos, objetivos de validacion, expected outcomes).

## Actualizacion M5-B1-01 (dataset operativo oficial QA/UAT)

Se ejecuta especificacion formal del dataset operativo para validacion de F1-F5.

### Entregable

1. `docs/M5-B1-01-DATASET-OPERATIVO-OFICIAL.md`

### Resultado

1. Casos oficiales definidos con IDs, precondiciones y expected outcomes.
2. Criterios de refresh establecidos (`db:seed` / `db:reset + db:seed`).
3. Criterios de aceptacion post-refresh y evidencia minima por ciclo QA/UAT definidos.
4. Versionado de dataset operativo oficial establecido (`v1.0-M5`).

Estado:

- M5-B1-01: **IMPLEMENTADO**.

## Siguiente punto

Ejecutar `M5-B1-02`: definir flujo operativo de refresh dataset QA/UAT (procedimiento ejecutable + checklist de control).

## Actualizacion M5-B1-02 (estandar de refresh dataset QA/UAT)

Se ejecuta estandarizacion del refresh operativo para evitar deriva entre ciclos.

### Entregables

1. Documento operativo:
- `docs/M5-B1-02-REFRESH-DATASET-QA-UAT.md`

2. Script reusable:
- `scripts/refresh-dataset-qa.ps1`

3. Comandos estandar en `package.json`:
- `pnpm dataset:refresh`
- `pnpm dataset:refresh:full`

### Resultado

1. Flujo de refresh unificado y versionado.
2. Checklist de control por corrida definido.
3. Criterios de consistencia QA/UAT formalizados.

Estado:

- M5-B1-02: **IMPLEMENTADO**.

## Siguiente punto

Ejecutar `M5-C1-01`: checklist RC v1 (gates obligatorios + evidencia por flujo F1-F5).

## Actualizacion M5-C1-01 (checklist RC v1)

Se ejecuta definicion de checklist RC con gates obligatorios para control de salida.

### Entregable

1. `docs/M5-C1-01-CHECKLIST-RC-V1.md`

### Resultado

1. Gates P1/P2 definidos con criterio PASS/FAIL.
2. Evidencia minima por flujo F1-F5 establecida.
3. Plantilla de evidencia por corrida RC incluida.
4. Decision gate final RC formalizada (Gate 6).

Estado:

- M5-C1-01: **IMPLEMENTADO**.

## Siguiente punto

Ejecutar `M5-A2-01`: hardening funcional P1 (BR-001/002/003/006/008) con plan de cambios backend/UI.

## Actualizacion M5-A2-01 (plan de cambios backend/UI P1)

Se ejecuta definicion del plan tecnico de implementacion para BR-001/002/003/006/008.

### Entregable

1. `docs/M5-A2-01-PLAN-CAMBIOS-BACKEND-UI.md`

### Resultado

1. Dise帽o de cambios API/UI definido por brecha.
2. Secuencia de implementacion establecida (backend primero, luego UI y validacion).
3. Plan de pruebas y criterio de aceptaci贸n M5-A2-01 documentados.
4. Riesgos tecnicos de implementacion identificados con mitigacion.

Estado:

- M5-A2-01: **PLAN DEFINIDO, LISTO PARA IMPLEMENTACION**.

## Siguiente punto

Ejecutar `M5-A2-02`: implementaci贸n incremental (API A1/A2 + UI B3/B5/B4 + sesi贸n B1/B2) con validaci贸n t茅cnica por bloque.

## Actualizacion M5-A2-02 (implementacion incremental P1)

Se ejecuta M5-A2-02 sobre BR-001/002/003/006/008 con secuencia backend -> UI -> validacion tecnica.

### Entregable

1. `docs/M5-A2-02-IMPLEMENTACION-INCREMENTAL.md`

### Resultado

1. `BR-006` implementada en backend (`422` con `details` estructurado de bloqueos).
2. `BR-001` implementada en UI (perfil `QA/PROD` y bloqueo de credenciales locales en `PROD`).
3. `BR-002` implementada en UI (refresh token persistente + refresh automatico/preventivo).
4. `BR-003` implementada en UI (bandeja por filtros contra `GET /expedientes`, con fallback IDs).
5. `BR-008` implementada en UI (selector dinamico de etapas reabribles).

### Evidencia tecnica

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`43/43`).
3. `pnpm.cmd --filter @pac/web typecheck` -> OK.
4. `pnpm.cmd --filter @pac/web build` -> OK.

Estado:

- M5-A2-02: **IMPLEMENTADO Y VALIDADO TECNICAMENTE**.

## Siguiente punto

Ejecutar validacion funcional visual guiada de M5-A2-02 (modo filtros, refresh de sesion, acciones F4/F5) y consolidar cierre operativo del bloque.

## Cierre operativo M5-A2-02 (validacion funcional visual guiada)

Fecha cierre: 2026-04-15

Resultado validacion:

1. `BR-001` validado:
- perfil `PROD` bloquea credenciales locales.
- perfil `QA` permite login operativo y carga token.

2. `BR-003` validado:
- bandeja por filtros carga expedientes sin IDs manuales.

3. `BR-008` validado:
- selector dinamico de etapas en F5 y bloqueo correcto cuando no hay candidatas.

4. `BR-006` validado:
- `422` expone detalle de bloqueos en UI (`Bloqueos: ALERTA:...`).

5. `BR-002` validado:
- refresh automatico confirmado ante access token invalido (`Sesion renovada automaticamente.`).

Estado:

- M5-A2-02: **CERRADO Y VALIDADO (TECNICO + OPERATIVO)**.

## Siguiente punto

Ejecutar `M5-C1` (gate RC) sobre baseline ya estabilizado.

## Cierre formal M5-C1 (gate RC)

Fecha cierre: 2026-04-15

Se ejecuta cierre formal de `M5-C1` con corrida de gate en baseline estable y evidencia consolidada en checklist RC.

### Evidencia de cierre

1. Calidad tecnica consolidada con `pnpm preflight:ci` en verde (lint + typecheck + unit + e2e + build web).
2. Validacion funcional guiada M5-A2-02 completada en UI/API para BR-001/002/003/006/008.
3. Checklist RC actualizado con decision final de gate (`docs/M5-C1-01-CHECKLIST-RC-V1.md`).

Estado:

- M5-C1: **CERRADO FORMALMENTE**.

## Siguiente bloque

Iniciar bloque de salida operativa de MacroFase 5:

- `M5-D1` - Paquete RC/cierre operativo (evidencia consolidada, decision de salida y handoff ejecutivo-tecnico).

## Cierre M5-D1 (paquete RC/cierre operativo)

Fecha cierre: 2026-04-15

Se ejecuta M5-D1 en la secuencia definida:

1. Consolidacion de evidencia final RC.
2. Matriz de riesgos residuales con dueno/fecha.
3. Decision formal de salida `go/no-go`.

### Entregables emitidos

1. `docs/M5-D1-PAQUETE-RC-CIERRE-OPERATIVO.md`
2. `docs/M5-D1-MATRIZ-RIESGOS-RESIDUALES.md`
3. `docs/M5-D1-DECISION-SALIDA-RC.md`

### Resultado

1. Gate RC consolidado sobre baseline documentado.
2. Riesgos bloqueantes: `0`.
3. Riesgos no bloqueantes: gestionados con mitigacion, dueno y fecha objetivo.
4. Decision formal: **GO (salida controlada)**.

Estado:

- M5-D1: **CERRADO FORMALMENTE**.

## Siguiente bloque

Iniciar `M5-E1` (ejecucion de salida operativa controlada + seguimiento de riesgos residuales y evidencia de estabilidad post-RC).

## Inicio M5-E1 (corrida controlada post-RC)

Fecha registro: 2026-04-15

Se ejecuta inicio formal de `M5-E1` con corrida controlada post-RC sobre baseline `c837dd9`.

### Entregable

1. `docs/M5-E1-CORRIDA-CONTROLADA-POST-RC.md`

### Resultado de corrida inicial

1. `preflight:local` en verde (`smoke + typecheck + unit + e2e`).
2. `health` API en `ok`.
3. Monitoreo interno con estado `degraded` por trafico de pruebas negativas (sin incremento de `5xx`).
4. Lectura operativa: estabilidad tecnica base confirmada, con alerta operativa esperable por perfil de validacion.

Estado:

- M5-E1: **INICIADO (corrida 1 ejecutada y documentada)**.

## Siguiente paso

Ejecutar `M5-E1-02`: ventana de observacion con trafico funcional limpio para snapshot `steady-state` y cierre operativo del bloque.

## Cierre M5-E1-02 (ventana steady-state y cierre de bloque)

Fecha cierre: 2026-04-15

Se ejecuta ventana limpia de 10 minutos con trafico funcional (`health` + `metrics`) y captura de evidencias de monitoreo.

### Entregable

1. `docs/M5-E1-02-VENTANA-STEADY-STATE.md`

### Resultado

1. Ventana 10 min: `200/200` en todos los ciclos.
2. Snapshot de proceso al cierre: `isHealthy=true`, `error_rate=0`, `requests5xxTotal=0`.
3. `alerts` permanece `degraded` por agregado historico 24h/7d (trafico de pruebas negativas previo), no por degradacion de la ventana limpia.

Estado:

- M5-E1: **CERRADO FORMALMENTE**.

## Siguiente bloque

Iniciar `M5-F1` (endurecimiento de lectura operativa de alertas historicas y preparacion de salida controlada siguiente).

## Cierre M5-F1 (separacion de se帽al operativa)

Fecha cierre: 2026-04-15

Se ejecuta endurecimiento de lectura operativa separando se帽al de monitoreo por perfil de trafico:

1. `operational` (operacion real)
2. `validation` (pruebas/QA/UAT)
3. `all` (vista agregada)

### Entregable

1. `docs/M5-F1-SEPARACION-SENAL-OPERATIVA.md`

### Resultado

1. API instrumentada con `x-traffic-profile` y fallback por entorno.
2. Metrics in-memory y historicas separadas por perfil/fuente.
3. Endpoints internos de metrics/alerts soportan filtro `profile`.
4. E2E marca trafico de prueba como `validation` para no contaminar lectura operacional.

### Evidencia tecnica

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`45/45`).
3. Logs e2e confirman `trafficProfile: validation`.

Estado:

- M5-F1: **CERRADO (IMPLEMENTADO + VALIDADO)**.

## Siguiente bloque

Preparar `M5-F2` para salida controlada siguiente (afinamiento de umbrales y operacion sobre perfil `operational`).

## Cierre M5-F2 (eliminacion de riesgo por contaminacion de senal)

Fecha cierre: 2026-04-15

Se ejecuta hardening tecnico-operativo para eliminar riesgo de mezcla entre trafico operacional y de validacion.

### Resultado por accion solicitada

1. **Header forzado en borde**:
- plantilla NGINX agrega `x-traffic-profile` forzado por host/ruta y evita sobrescritura externa.

2. **Valores no permitidos bloqueados**:
- borde y backend rechazan valores invalidos (`400`) fuera de `operational|validation`.

3. **Ruta interna QA aislada**:
- habilitada via `QA_INTERNAL_PATH_PREFIX` para trafico `validation`.

4. **Default estricto en produccion**:
- en produccion se registra `security.metrics_profile_missing` y se permite rechazo por politica.

5. **Dashboards/alertas fijadas a operational**:
- UI consulta endpoints internos con `profile=operational` como baseline de operacion.

6. **SLO de etiquetado aplicado**:
- nueva metrica `profile_header_valid_rate` con umbral `>= 0.999` y regla de alerta 24h.

7. **Prueba anti-contaminacion**:
- E2E valida aislamiento de contadores `operational` vs trafico `validation`.

8. **Runbook operativo corto**:
- emitido con verificacion diaria y manejo de desvios.

### Evidencia tecnica de cierre

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`46/46`).
3. `pnpm.cmd --filter @pac/web build` -> OK.

### Entregables

1. `docs/M5-F2-RUNBOOK-OPERACION-PERFIL-METRICAS.md`
2. `infra/proxy/nginx/traffic-profile.conf`
3. Ajustes backend/UI de perfilado, SLO y alertas (M5-F2).

Estado:

- M5-F2: **CERRADO (IMPLEMENTADO + VALIDADO)**.

### Validacion de borde (estado operativo actual)

Estado actual: **VALIDACION LOCAL COMPLETADA / PRODUCCION PENDIENTE**.

Evidencia local ejecutada (Docker + NGINX como borde):

1. Rechazo de header invalido (`x-traffic-profile=bad_value`) -> `400`.
2. Request normal a `health` via borde local -> `200`.
3. Politica de inyeccion/rechazo desplegada y activa en borde local (`pac-nginx-edge`).

Pendiente no bloqueante para cierre definitivo en entorno real:

1. Desplegar misma politica en WAF/LB/Gateway productivo.
2. Repetir pruebas de cierre en produccion:
- Prueba A: invalido -> `400`.
- Prueba B: normal -> `200`.
- Prueba C: snapshot operacional -> `GET /api/v1/internal/metrics?profile=operational`.
3. Registrar evidencia de esas 3 pruebas y cerrar riesgo residual en acta.

## Siguiente bloque

Iniciar paquete final de salida de MacroFase 5 con enfoque en operacion sostenida y release controlado.

- PND-M5-F2-PROD: validar borde real con 3 pruebas (400 inv醠ido, 200 normal, metrics?profile=operational).
