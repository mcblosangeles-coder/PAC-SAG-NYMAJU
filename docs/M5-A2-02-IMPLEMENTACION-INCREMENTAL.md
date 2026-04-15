# M5-A2-02 - Implementacion incremental backend/UI (BR-001/002/003/006/008)

## Fecha
2026-04-15

## Objetivo

Ejecutar los cambios P1 definidos en `M5-A2-01` para cerrar brechas operativas criticas en F1-F5.

## Alcance ejecutado

### Backend

1. `BR-006` - Respuesta `422` enriquecida en `change-state`:
- `ExpedienteServiceError` ahora soporta `details`.
- `changeState` agrega:
  - `blockingAlertsCount`,
  - `blockingNcCount`,
  - `blockingReasons` estructurado (`ALERTA`/`NC`).
- rutas de expedientes exponen `details` bajo contrato API de error.

### Frontend

1. `BR-001` - Perfil de autenticacion por entorno:
- selector `QA/PROD`,
- en `PROD` se bloquean credenciales locales por defecto (`admin@pac.local`).

2. `BR-002` - Ciclo de sesion:
- almacenamiento de `refreshToken`,
- lectura de expiracion JWT (`exp`),
- refresh automatico en `401` y refresh preventivo cerca de expiracion.

3. `BR-003` - Bandeja operativa por filtros:
- nuevo modo `Filtros operativos` consumiendo `GET /expedientes`,
- soporte para `q`, `estadoGlobal`, `responsableUserId`, `page`, `pageSize`,
- fallback mantenido para modo `IDs manuales`.

4. `BR-008` - Reapertura por selector dinamico:
- input libre reemplazado por `select` de etapas reabribles,
- elegibilidad basada en estados:
  `CERRADA|RECHAZADA|VENCIDA|BLOQUEADA|OBSERVADA`.

5. UX de `BR-006`:
- mensaje `422` ahora muestra bloqueos concretos cuando API entrega `details`.

## Evidencia tecnica ejecutada

1. `pnpm.cmd --filter @pac/api typecheck` -> OK.
2. `pnpm.cmd --filter @pac/api test:e2e` -> OK (`43/43`).
3. `pnpm.cmd --filter @pac/web typecheck` -> OK.
4. `pnpm.cmd --filter @pac/web build` -> OK.

## Evidencia funcional visual guiada (navegador)

Resultado de validacion operativa (2026-04-15):

1. `BR-001` perfil `PROD`:
- bloqueo correcto de credenciales locales (`admin@pac.local`) con mensaje `INVALID_PAYLOAD`.

2. `BR-001` perfil `QA`:
- login exitoso, token cargado automaticamente.

3. `BR-003` bandeja por filtros:
- carga operativa por `q=PAC-VERIF`, sin depender de IDs manuales.

4. `BR-008` selector dinamico F5:
- input libre reemplazado por selector.
- cuando no hay candidatas, muestra `Sin etapas reabribles` y deshabilita accion.

5. `BR-006` `422` enriquecido:
- mensaje UI muestra detalle de bloqueo (`Bloqueos: ALERTA:...`).

6. `BR-002` refresh de sesion:
- con access token invalido, recuperacion automatica confirmada (`Sesion renovada automaticamente.`).

## Estado de brechas P1

1. `BR-001`: CERRADA.
2. `BR-002`: CERRADA.
3. `BR-003`: CERRADA.
4. `BR-006`: CERRADA.
5. `BR-008`: CERRADA.

## Riesgos residuales

1. Recomendado validar en QA que el perfil `PROD` use credenciales reales no locales.

## Siguiente paso recomendado

Pasar a bloque RC (`M5-C1`) con M5-A2-02 cerrado tecnica y operativamente.
