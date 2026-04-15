# ACTA DE AVANCE - MACROFASE 4

## Fecha
2026-04-14

## Estado general

- MacroFase 4: INICIADA
- Bloque M4-A (flujo funcional core): EN CURSO

## Actualizacion M4-A1-01 (cierre y validacion de baseline funcional)

Se ejecuta validacion formal del baseline MVP para controlar alcance y priorizacion de implementacion.

### Decision oficial

Se aprueba como baseline oficial P1 el siguiente set de 5 flujos criticos:

1. F1 acceso seguro y contexto de usuario (`login`, `me`, `refresh`).
2. F2 consulta operativa de expediente.
3. F3 lectura de workflow e historial de estados.
4. F4 cambio de estado del expediente.
5. F5 reapertura de etapa.

### Criterio de control de alcance

1. Cualquier nuevo flujo fuera de F1-F5 no entra como P1 sin aprobacion explicita.
2. El avance de M4 se mide contra cobertura funcional y E2E de F1-F5.
3. Contrato UI/API y validacion de negocio quedan anclados a este baseline.

### Evidencia documental

1. `docs/M4-A1-01-FLUJOS-CRITICOS-MVP.md`
2. `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md`

## Resultado

- M4-A1-01: CERRADO Y VALIDADO (baseline oficial aprobado).
- M4-A1-02: CERRADO (contrato API alineado al backend actual).

## Siguiente punto

M4-A2-01: ejecutar ajustes backend puntuales para cerrar brechas del contrato y preparar pruebas E2E funcionales de negocio sobre F1-F5.

## Actualizacion M4-A2-01 (ajustes backend y preparacion E2E)

Se ejecuta M4-A2-01 con enfoque de ajuste minimo sobre contrato y cobertura funcional.

### Ajuste backend aplicado

1. Endpoint `GET /api/v1/auth/me`:
- semantica corregida para usuario inexistente:
  - respuesta final: `404 NOT_FOUND`.

### Ajuste contractual aplicado

1. Documento `M4-A1-02-CONTRATO-API-FLUJOS-MVP.md` actualizado:
- caso `auth/me` usuario no encontrado queda definido como `404 NOT_FOUND`.

### Cobertura E2E preparada

1. Suite e2e actualizada para incluir caso:
- `auth/me` con token valido de usuario inexistente -> `404 NOT_FOUND`.

2. Documento de actividad:
- `docs/M4-A2-01-AJUSTES-BACKEND-Y-E2E.md`.

## Estado

- M4-A2-01: IMPLEMENTADO.

## Siguiente punto

Ejecutar evidencia tecnica final:
1. `pnpm.cmd --filter @pac/api typecheck`
2. `pnpm.cmd --filter @pac/api test:e2e`

## Cierre tecnico M4-A2-01

Evidencia ejecutada:

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`39/39`).

Resultado:

- M4-A2-01: VALIDADO Y CERRADO.

## Siguiente punto operativo recomendado

M4-D1-01: consolidar suite E2E de negocio por flujo (F1-F5) con matriz de trazabilidad test -> flujo -> criterio de salida MVP.

## Actualizacion M4-D1-01 (matriz de trazabilidad E2E por flujo F1-F5)

Se ejecuta M4-D1-01 y se formaliza el control de salida funcional MVP.

### Entregable

1. `docs/M4-D1-01-MATRIZ-TRAZABILIDAD-E2E-MVP.md`

### Cobertura incluida

1. Trazabilidad completa:
- flujo -> endpoint -> escenario -> estado esperado -> evidencia de prueba.
2. Flujos incluidos:
- F1 acceso seguro,
- F2 consulta operativa,
- F3 workflow + historial,
- F4 cambio de estado,
- F5 reapertura de etapa.
3. Criterio de salida MVP definido como gate funcional M4-D1.

### Estado

- M4-D1-01: IMPLEMENTADO (matriz creada, lista para validacion final).

## Siguiente punto

Validar M4-D1-01 y, si se aprueba, avanzar a M4-B1 (bandeja/listado y detalle operativo UI) con foco en F2-F5.

## Cierre de validacion M4-D1-01

Resultado:

- M4-D1-01: VALIDADO.
- Matriz de trazabilidad E2E F1-F5 adoptada como gate funcional de salida MVP.

## Actualizacion M4-B1 (UI operativa F2-F5)

Se ejecuta M4-B1 sobre `apps/web` con enfoque de operacion diaria para expedientes.

### Entregable

1. `docs/M4-B1-UI-OPERATIVA-EXPEDIENTES.md`

### Implementacion

1. Bandeja/listado por IDs de expediente (input manual + carga de resumen).
2. Detalle operativo:
- resumen F2,
- workflow F3,
- historial F3 con filtro de scope.
3. Acciones operativas:
- `change-state` (F4),
- `reopen-stage` (F5),
- feedback y recarga de datos.
4. Persistencia local de access token de operacion.

### Evidencia tecnica

1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.
3. Evidencia visual de salida frontend entregada por usuario:
   - `C:/1.-SKYGEN SPA 2024/6.- Clientes/32.- David Ebner (San Carlos)/6.-PAC-NYMAJU-SPR-001/2.- APP-WEB/REG-localhost5173.pdf`

## Estado

- M4-B1: IMPLEMENTADO Y VALIDADO TECNICAMENTE.
- Evidencia de salida frontend: recibida.
- Pendiente: completar validacion funcional guiada de flujos (bandeja -> detalle -> change-state/reopen-stage -> historial) para cierre operativo total.

## Siguiente punto

Ejecutar validacion funcional visual M4-B1 (bandeja -> detalle -> change-state/reopen-stage -> refresco de historial) y cerrar formalmente el bloque.

## Cierre funcional M4-B1 (validacion guiada en navegador)

Fecha cierre: 2026-04-15

Caso de validacion:
- expediente `35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431` (`PAC-VERIF-001`).

Resultados:

1. F2/F3 (bandeja + detalle + historial): OK.
2. F4 (`change-state` con `APROBADO`): `UNPROCESSABLE_ENTITY` por bloqueos activos (esperado por regla de negocio).
3. F5 (`reopen-stage` con `REVISION_TECNICA`): `NOT_FOUND` (etapa no encontrada en expediente de prueba), manejo UI/API correcto.

Decision:

- M4-B1: CERRADO (objetivo de UI operativa y feedback de negocio cumplido).
- Pendiente no bloqueante para siguiente iteracion: evidencia de camino `200` en F5 usando expediente con etapa objetivo existente.

## Siguiente punto recomendado

M4-B2: estandarizacion UX de errores de negocio y mensajes accionables (`409/422/404`) + refinamiento de formularios operativos.

## Actualizacion M4-B2 (estandarizacion UX de errores 409/422/404)

Se ejecuta M4-B2 con foco en legibilidad operativa y accionabilidad de errores.

### Entregable

1. `docs/M4-B2-ESTANDARIZACION-UX-ERRORES.md`

### Cambios aplicados

1. Parser de error API estructurado (`status`, `code`, `message`).
2. Mapeo UX contextual de mensajes para:
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 UNPROCESSABLE_ENTITY`
- `401/403/400` de soporte operativo.
3. Aplicacion del mapeo en:
- bandeja/detalle (`inbox`, `detail.*`),
- acciones `change-state`,
- acciones `reopen-stage`.

### Evidencia tecnica

1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.

## Estado

- M4-B2: IMPLEMENTADO Y VALIDADO TECNICAMENTE.

## Siguiente punto recomendado

M4-C1: actualizar contrato funcional UI/API y runbook operativo MVP con el comportamiento UX final de errores.

## Actualizacion M4-C1 (contrato funcional + runbook MVP)

Se ejecuta M4-C1 sobre capa documental-operativa para cierre de handoff funcional.

### Entregables

1. Contrato actualizado:
- `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md`
- se agrega seccion "Estandar UX de errores (M4-B2 aplicado)".

2. Runbook MVP:
- `docs/M4-C1-RUNBOOK-OPERACION-MVP.md`
- incluye:
  - precondiciones operativas,
  - diagnostico por error (`401/403/404/409/422`),
  - procedimiento de validacion post-deploy,
  - criterios de escalamiento.

## Estado

- M4-C1: IMPLEMENTADO.

## Siguiente punto recomendado

M4-D2: preparar acta final de salida de MacroFase 4 (criterio de salida, riesgos residuales y handoff).

## Cierre M4-D2 (salida formal de MacroFase 4)

Se ejecuta M4-D2 y se consolida cierre administrativo-tecnico de MacroFase 4.

### Entregable de cierre

1. `docs/ACTA-CIERRE-MACROFASE-4.md`

### Resultado

1. Criterio de salida: cumplido.
2. Riesgos residuales: documentados con mitigacion.
3. Handoff: documentado con artefactos y recomendacion de arranque.
4. Estado MacroFase 4: **CERRADA FORMALMENTE**.

## Mitigacion post-cierre de riesgos M4

Se ejecuta mitigacion tecnica de los riesgos residuales reportados en cierre M4.

Resultados:

1. Dataset de validacion ampliado en seed base (cobertura F2/F3/F4/F5).
2. UI M4-B1 con login operativo integrado para eliminar dependencia de token manual.
3. Riesgo de evidencia F5 (`200`) reducido mediante expediente semilla reabrible (`PAC-VERIF-001`).

Estado:

- Riesgos residuales de M4: mitigados a nivel bajo y controlado.

## Revalidacion post-consolidacion (2026-04-15)

Se ejecuta control de linea base unica tras commit de consolidacion:

1. Commit validado: `0133753` (`main`).
2. Workflow remoto: `CI Quality Gates #12` -> `completed successfully`.
3. Decision: iniciar directamente M4-A1-02 sobre baseline consolidado.

### Inicio operativo M4-A1-02 (directo)

Objetivo inmediato:

1. Revalidar contrato API F1-F5 contra estado actual de rutas/controladores.
2. Confirmar codigos y payloads de error aplicables por flujo (`400/401/403/404/409/422/429/500`).
3. Dejar contrato en estado "listo para ejecucion de ajustes de backend/UI".

Estado:

- M4-A1-02: EN EJECUCION (revalidacion contractual post-consolidacion).

## Cierre tecnico M4-A1-02 (revalidacion endpoint por endpoint)

Fecha cierre: 2026-04-15

Accion ejecutada:

1. Revalidacion tecnica F1-F5 contra rutas/controladores/servicios actuales.
2. Cruce de contrato con evidencia de pruebas E2E vigentes.
3. Ajuste contractual para eliminar desviaciones no implementadas.

Resultado:

1. Se detectaron brechas documentales en F2/F3/F4/F5 (payload y codigos esperados).
2. No se detectaron brechas bloqueantes de implementacion backend para M4-A1-02.
3. Contrato actualizado y alineado al comportamiento real de API.

Estado final:

- M4-A1-02: CERRADO Y VALIDADO.

## Inicio M4-A2-01 (iteracion post-congelamiento contractual)

Fecha inicio: 2026-04-15

Decision operativa:

1. Usar `M4-A1-02` como contrato congelado unico para cualquier ajuste backend/UI nuevo.
2. Reabrir M4-A2-01 en modalidad iterativa para ejecutar validacion de cumplimiento contractual sobre baseline consolidado.
3. Limitar cambios a incidencias funcionales reales (evitar retrabajo documental sin impacto).

Objetivo de esta iteracion:

1. Confirmar cumplimiento contrato-backend F1-F5.
2. Aplicar ajustes minimos si aparece brecha bloqueante.
3. Cerrar con evidencia tecnica y acta.

Estado:

- M4-A2-01 (iteracion post-congelamiento): EN EJECUCION.

## Cierre M4-A2-01 (iteracion post-congelamiento contractual)

Fecha cierre: 2026-04-15

Evidencia tecnica ejecutada:

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`43/43`).
3. `pnpm.cmd --filter @pac/web build` -> OK.

Resultado:

1. Contrato congelado M4-A1-02 aplicado como baseline unico.
2. Sin brechas funcionales bloqueantes backend/UI para F1-F5 en esta iteracion.
3. M4-A2-01 (iteracion post-congelamiento): CERRADO Y VALIDADO.

## Registro de pendiente no bloqueante M4-B1 (F5 camino 200)

Fecha registro: 2026-04-15

ID pendiente: `PNB-M4-B1-F5-200`

Detalle:

1. Se valida correctamente manejo de error de negocio F5 (`409 CONFLICT`) en UI/API.
2. Queda pendiente evidencia de caso positivo `200` para `reopen-stage` por dataset local no reabrible en los expedientes usados.

Plan de cierre (sin frenar avance):

1. Dueno: Backend/Data.
2. Fecha objetivo: 2026-04-16.
3. Acciones:
- crear expediente semilla reabrible,
- ejecutar prueba dirigida F5 `200`,
- anexar evidencia y cerrar pendiente en acta.

Estado:

- `PNB-M4-B1-F5-200`: ABIERTO (no bloqueante).

## M4-B2 (iteracion guiada por validacion real M4-B1)

Fecha: 2026-04-15

Entrada:

1. Evidencia funcional real:
- F4 devuelve `422` esperado por precondiciones.
- F5 devuelve `409` consistente por etapa no reabrible.

Accion ejecutada:

1. Ajuste UX de error `409` en `reopen-stage` para mensaje prescriptivo con estados fuente validos (`CERRADA|OBSERVADA|BLOQUEADA|VENCIDA|RECHAZADA`).
2. Registro de ajuste en documento M4-B2.

Evidencia tecnica:

1. `pnpm.cmd --filter @pac/web typecheck` -> OK.
2. `pnpm.cmd --filter @pac/web build` -> OK.

Estado:

- M4-B2 (iteracion 2026-04-15): CERRADO Y VALIDADO.
