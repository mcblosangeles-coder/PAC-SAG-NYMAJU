# ACTA DE CIERRE - MACROFASE 4

## Fecha
2026-04-15

## 1) Diagnostico de cierre

### Hechos confirmados

1. Se completo el baseline funcional MVP sobre F1-F5:
- F1 acceso seguro (`login/me/refresh`)
- F2 consulta operativa
- F3 workflow + historial
- F4 cambio de estado
- F5 reapertura de etapa
2. Se consolido trazabilidad de pruebas E2E por flujo:
- `docs/M4-D1-01-MATRIZ-TRAZABILIDAD-E2E-MVP.md`
3. Se implemento UI operativa de expedientes (bandeja + detalle + acciones F4/F5):
- `docs/M4-B1-UI-OPERATIVA-EXPEDIENTES.md`
4. Se estandarizo UX de errores de negocio (`404/409/422` + `401/403/400`) con mensajes accionables:
- `docs/M4-B2-ESTANDARIZACION-UX-ERRORES.md`
5. Se actualizo contrato funcional UI/API y runbook MVP:
- `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md`
- `docs/M4-C1-RUNBOOK-OPERACION-MVP.md`

### Evidencia tecnica confirmada

1. API:
- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> OK (`39/39`)
2. Web:
- `pnpm.cmd --filter @pac/web typecheck` -> OK
- `pnpm.cmd --filter @pac/web build` -> OK

## 2) Criterio de salida (Go / No-Go)

### Criterio formal de salida M4

Se considera MacroFase 4 cerrada cuando:

1. Flujos F1-F5 quedan definidos y validados.
2. Existe contrato funcional UI/API vigente.
3. Existe trazabilidad E2E por flujo.
4. Existe runbook operativo MVP para soporte funcional.
5. Evidencia tecnica en verde para API y Web.

### Resultado actual

- Resultado: **GO (salida de MacroFase 4 aprobada)**.
- Alcance del GO: continuidad a siguiente macrofase de producto/operacion, no certificacion productiva final por si sola.

## 3) Riesgos residuales

> Escala: Critico / Alto / Medio / Bajo

1. **Medio** - Camino `200` de F5 (`reopen-stage`) no evidenciado en expediente de validacion utilizado.
- Impacto: cobertura funcional completa de F5 condicionada al dataset.
- Mitigacion: preparar expediente semilla con etapa objetivo reabrible y ejecutar evidencia controlada de `200`.

2. **Medio** - Dependencia de token manual en UI operativa para pruebas MVP.
- Impacto: friccion operativa en validaciones manuales.
- Mitigacion: incorporar flujo UI de login session-aware o helper de token para entorno QA.

3. **Bajo** - Validacion funcional se apoyo en un set reducido de expedientes de prueba.
- Impacto: variabilidad de casos limite no totalmente cubierta en UI.
- Mitigacion: ampliar dataset de escenarios (bloqueos, estados, etapas presentes/ausentes).

## 3.1) Mitigacion ejecutada de riesgos M4 (post-cierre)

Fecha mitigacion: 2026-04-15

1. Riesgo F5 sin evidencia de camino `200`:
- Mitigado con dataset semilla M4 que incluye expediente `PAC-VERIF-001` con etapa `REVISION_TECNICA` en estado `CERRADA`, habilitando `reopen-stage` exitoso (`200`).

2. Riesgo de dependencia de token manual en UI:
- Mitigado con login operativo integrado en la UI M4-B1 (`email/password -> access token`) para eliminar dependencia de pegado manual en pruebas.

3. Riesgo por cobertura limitada de dataset:
- Mitigado con dataset expandido de 3 expedientes operativos:
  - `PAC-VERIF-001` (flujo F5 positivo),
  - `PAC-VERIF-002` (bloqueo activo para validar `422` en F4),
  - `PAC-VERIF-003` (consulta F2/F3 base).

Estado residual actualizado:
- Riesgo 1: Bajo (controlado por dataset reproducible).
- Riesgo 2: Bajo (login UI operativo disponible).
- Riesgo 3: Bajo (cobertura minima de escenarios ya instalada).

### Evidencia ejecutada de mitigacion

1. Seed de dataset M4:
- `pnpm.cmd db:seed` -> OK, incluyendo `dataset de validacion M4`.

2. Verificacion F5 camino positivo:
- `POST /api/v1/expedientes/35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431/reopen-stage`
- Resultado: `200`, `estadoAnterior=CERRADA`, `estadoNuevo=REABIERTA`.

3. Verificacion F4 precondicion de bloqueo:
- `POST /api/v1/expedientes/b84fb315-bf65-40d4-86ff-6e4a52149965/change-state`
- Resultado: `422 UNPROCESSABLE_ENTITY` por bloqueos activos.

4. Validacion UI post-ajuste:
- `pnpm.cmd --filter @pac/web typecheck` -> OK.
- `pnpm.cmd --filter @pac/web build` -> OK.

## 4) Handoff a siguiente macrofase

## Objetivo de handoff

Entregar una base MVP funcional trazable, con contrato y operacion documentada, para evolucion de producto sin regresion funcional.

### Entradas de handoff (artefactos)

1. `docs/M4-A1-01-FLUJOS-CRITICOS-MVP.md`
2. `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md`
3. `docs/M4-D1-01-MATRIZ-TRAZABILIDAD-E2E-MVP.md`
4. `docs/M4-B1-UI-OPERATIVA-EXPEDIENTES.md`
5. `docs/M4-B2-ESTANDARIZACION-UX-ERRORES.md`
6. `docs/M4-C1-RUNBOOK-OPERACION-MVP.md`
7. `docs/ACTA-AVANCE-MACROFASE-4.md`

### Recomendacion de arranque de siguiente frente

1. Ejecutar paquete de verificacion base:
- `pnpm.cmd --filter @pac/api test:e2e`
- `pnpm.cmd --filter @pac/web build`
2. Completar evidencia de camino `200` para F5 con dataset preparado.
3. Definir backlog de refinamiento UX/operacion sobre base M4 cerrada.

## 5) Decision de cierre

MacroFase 4 queda **CERRADA FORMALMENTE**, con criterio de salida cumplido, riesgos residuales documentados y handoff listo para continuidad.
