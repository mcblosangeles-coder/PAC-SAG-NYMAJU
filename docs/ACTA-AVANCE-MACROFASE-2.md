# ACTA DE AVANCE - MACROFASE 2

## Fecha
2026-04-13

## Hito registrado

Se completa el **Punto 1** de MacroFase 2: implementación real de cambio de estado de expediente.

## Alcance implementado

1. Servicio transaccional de dominio
- `expedientesService.changeState(...)`
- Actualiza `Expediente.estadoGlobal`
- Registra historial en `ExpedienteHistorialEstado`
- Registra auditoría obligatoria en `AuditLog`
- Ejecución atómica en transacción Prisma

2. Ruta operativa
- `POST /api/v1/expedientes/:id/change-state`
- Reemplaza comportamiento piloto
- Retorna `200` con `estadoAnterior` y `estadoNuevo` reales

3. Verificación técnica
- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 6/6 OK

## Estado

- Punto 1: COMPLETADO Y VALIDADO
- Punto 2: COMPLETADO Y VALIDADO
- Punto 3: COMPLETADO Y VALIDADO

## Actualización Punto 2

Se implementan precondiciones de workflow y control de transiciones válidas para cambio de estado:

1. Matriz de transiciones permitidas por `EstadoExpedienteGlobal`.
2. Bloqueo de transición inválida con `409 Conflict`.
3. Bloqueo cuando el estado objetivo coincide con el estado actual (`409`).
4. Persistencia transaccional mantenida (estado + historial + auditoría).

### Evidencia técnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 7/7 OK

## Siguiente punto

Validar y ejecutar siguiente vertical funcional del workflow (Punto 4).

## Actualización Punto 3

Se implementa `reopen-stage` real con persistencia transaccional y validación de precondiciones:

1. Mutación efectiva de `ExpedienteEtapa.estadoEtapa` a `REABIERTA`.
2. Registro de reapertura en `ReaperturaEtapa`.
3. Registro en `ExpedienteEtapaHistorialEstado`.
4. Auditoría obligatoria en `AuditLog`.
5. Control de precondiciones de reapertura con respuesta `409` en transición inválida.
6. Endpoint `POST /api/v1/expedientes/:id/reopen-stage` deja estado de piloto y opera sobre datos reales.

### Evidencia técnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 9/9 OK

## Actualizacion Punto 4

Se implementa workflow operativo y hardening de contrato HTTP en rutas de expediente:

1. Endpoint `GET /api/v1/expedientes/:id/workflow` deja estado piloto y responde datos reales de workflow.
2. Integracion con `workflowService.getWorkflow(...)` para etapas, bloqueos y capacidad de avance.
3. Estandarizacion de errores en rutas de expedientes con `code` + `message`.
4. Sanitizacion de parametros/body (`trim`) y validaciones de entrada consistentes.
5. Mapeo de errores de dominio (`404`, `409`) a contrato HTTP estable.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 10/10 OK

## Estado actualizado

- Punto 4: COMPLETADO Y VALIDADO

## Siguiente punto

Alinear contrato HTTP del modulo `auth` al mismo estandar (`code` + `message`) y ejecutar validacion tecnica.

## Actualizacion Punto 5

Se alinea el modulo de autenticacion al contrato HTTP estandar:

1. `auth.routes.ts` responde errores con estructura uniforme: `code` + `message`.
2. Validacion y sanitizacion de payload en `login` y `refresh`.
3. Extraccion robusta de bearer token y validacion estricta de `sub` en `GET /me`.
4. Normalizacion de mensajes de error en estados `400`, `401` y `500`.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 10/10 OK

## Estado actualizado

- Punto 5: AVANZADO Y VALIDADO

## Siguiente punto

Unificar contrato global de errores en `apps/api/src/app.ts` (404 y middleware de excepciones) con el mismo estandar de respuesta.

## Actualizacion Punto 6

Se unifica el contrato global de errores en el bootstrap API:

1. `404` de rutas no encontradas ahora responde con `code: NOT_FOUND` y `message`.
2. Middleware global de excepciones responde con `code: INTERNAL_ERROR` y `message`.
3. Se mantiene compatibilidad de status codes y flujo actual de middlewares.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 10/10 OK

## Estado actualizado

- Punto 6: AVANZADO Y VALIDADO

## Siguiente punto

Agregar pruebas e2e para contrato de errores estandarizado (assert de `code`) en endpoints clave.

## Actualizacion Punto 7

Se amplian pruebas e2e para validar contrato de errores estandarizado (`code` + `message`) en endpoints clave:

1. `GET /expedientes/:id/workflow` en caso `404` valida `code: NOT_FOUND`.
2. `POST /expedientes/:id/change-state` en caso `409` valida `code: CONFLICT`.
3. `POST /expedientes/:id/reopen-stage` en casos `409` y `500` valida `code: CONFLICT` y `code: INTERNAL_ERROR`.
4. `GET /api/v1/unknown-endpoint` valida contrato global `404` con `code: NOT_FOUND`.
5. `POST /api/v1/auth/login` con payload invalido valida `code: INVALID_PAYLOAD`.

Nota tecnica:
- Los middleware `authenticate/authorize` aun responden con `message` sin `code`; este punto cubre solo capas ya estandarizadas (app, auth routes y expedientes routes).

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 12/12 OK

## Estado actualizado

- Punto 7: AVANZADO Y VALIDADO

## Siguiente punto

Estandarizar respuestas de error en `authenticate.ts` y `authorize.ts` para cerrar uniformidad transversal del API.

## Actualizacion Punto 8

Se estandarizan respuestas de seguridad en middlewares transversales:

1. `authenticate.ts` responde `401` con contrato `code + message` (`UNAUTHENTICATED`).
2. `authorize.ts` responde `401/403/400` con contrato `code + message` (`UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_PARAM`).
3. Se mantiene metadata existente (`requiredPermission`, `scope`) donde aplica, sin romper compatibilidad.
4. Se robustece parsing de bearer token con `trim` y split por espacios multiples.

Cobertura e2e ampliada:

1. `401` sin bearer valida `code: UNAUTHENTICATED`.
2. `403` por permiso faltante valida `code: FORBIDDEN`.
3. `403` por denegacion de alcance valida `code: FORBIDDEN`.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 12/12 OK

## Estado actualizado

- Punto 8: AVANZADO Y VALIDADO

## Siguiente punto

Estandarizar codigos de error de negocio en catalogo compartido (constantes tipadas) para evitar divergencias entre modulos.

## Actualizacion Punto 9

Se implementa catalogo central tipado de errores HTTP en API:

1. Nuevo modulo `apps/api/src/lib/api-error.ts` con:
- `API_ERROR_CODE` (constantes unificadas).
- `ApiErrorCode` (tipo derivado).
- `sendApiError(...)` (helper estandar de respuesta).
2. Refactor transversal para consumir el catalogo en:
- `app.ts`
- `auth.routes.ts`
- `expedientes.routes.ts`
- `middlewares/authenticate.ts`
- `middlewares/authorize.ts`
3. Se elimina duplicacion de literales de codigo entre modulos y se reduce riesgo de divergencia.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 12/12 OK

## Estado actualizado

- Punto 9: AVANZADO Y VALIDADO

## Siguiente punto

Agregar pruebas unitarias directas para `api-error.ts` y `mapServiceErrorCode` para blindar el contrato de codigos a nivel de utilidades.

## Actualizacion Punto 10

Se implementan pruebas unitarias directas para el contrato de errores:

1. `api-error.unit.test.ts`
- Valida estabilidad del catalogo `API_ERROR_CODE`.
- Valida comportamiento de `sendApiError(...)` (status + payload + metadatos extra).
2. `expedientes-error-mapping.unit.test.ts`
- Valida mapeo de dominio `status -> code`:
  - `404 -> NOT_FOUND`
  - `409 -> CONFLICT`
  - otros -> `INTERNAL_ERROR`
3. Se extrae mapeo de estado a modulo dedicado y reutilizable:
- `modules/expedientes/error-mapping.ts`
4. Se agrega script `test:unit` en `apps/api/package.json`.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:unit` -> 5/5 OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 12/12 OK

## Estado actualizado

- Punto 10: AVANZADO Y VALIDADO

## Siguiente punto

Definir cobertura minima de regresion para auth (`/auth/me`, `/auth/refresh`) con asserts de `code` y mensajes en escenarios invalidos.

## Actualizacion Punto 11

Se implementa cobertura minima de regresion para auth con asserts de contrato de error (`code + message`):

1. `/api/v1/auth/me`
- `401 UNAUTHENTICATED` sin token.
- `401 UNAUTHENTICATED` con token valido criptograficamente pero payload invalido (sin `sub`).
2. `/api/v1/auth/refresh`
- `400 INVALID_PAYLOAD` sin `refreshToken`.
- `401 UNAUTHENTICATED` con refresh token invalido.

Resultado:
- La suite e2e sube de 12 a 16 pruebas y mantiene todo en verde.

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 16/16 OK

## Estado actualizado

- Punto 11: AVANZADO Y VALIDADO

## Siguiente punto

Agregar validacion de contrato en endpoint `health` y definir smoke-test rapido de plataforma para pre-check de despliegue local.

## Actualizacion Punto 12

Se valida formalmente el contrato del endpoint `GET /api/v1/health` mediante prueba e2e dedicada:

1. Estado HTTP `200`.
2. `Content-Type` JSON.
3. Estructura de payload esperada:
- `service: "api"`
- `status: "ok"`
- `timestamp: string` parseable como fecha
4. Verificacion de que `health` no incorpora campo `code` en respuesta de exito (contrato de error solo aplica a respuestas de error).

### Evidencia tecnica

- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 17/17 OK

## Estado actualizado

- Punto 12: AVANZADO Y VALIDADO

## Siguiente punto

Definir e implementar smoke-test rapido de plataforma (pre-check local) para API, DB y Redis.

## Actualizacion Punto 13

Se define e implementa smoke-test rapido de plataforma local:

1. Nuevo script `scripts/smoke-local.ps1`.
2. Nuevo comando raiz `pnpm smoke:local`.
3. Validaciones incluidas:
- `pac-postgres` en ejecucion + healthy.
- `pac-redis` en ejecucion + healthy.
- `GET /api/v1/health` con contrato esperado (`service=api`, `status=ok`).
- endpoint protegido de expediente responde `401` con `code=UNAUTHENTICATED`.
4. Comportamiento operativo:
- si la API no esta activa, el script puede levantar temporalmente `@pac/api dev` para ejecutar el pre-check y luego detener el proceso.
- se documenta modo manual sin autoarranque (`-AutoStartApi:$false`).

### Evidencia tecnica

- `pnpm.cmd smoke:local` -> PASS
- `pnpm.cmd --filter @pac/api typecheck` -> OK
- `pnpm.cmd --filter @pac/api test:unit` -> 5/5 OK
- `pnpm.cmd --filter @pac/api test:e2e` -> 17/17 OK

## Estado actualizado

- Punto 13: AVANZADO Y VALIDADO

## Siguiente punto

Consolidar checklist de pre-release (comandos y criterios PASS/FAIL) en documento operativo de deployment local.

## Actualizacion Punto 14

Se consolida checklist operativo de pre-release local en documento dedicado:

1. Nuevo documento `docs/CHECKLIST-PRE-RELEASE-LOCAL.md`.
2. Incluye secuencia estandar de validacion:
- `docker:up`
- `smoke:local`
- `typecheck` API
- `test:unit` API
- `test:e2e` API
3. Define criterios PASS/FAIL por cada paso.
4. Define criterio de cierre: pre-release aprobado solo si todos los pasos quedan en PASS.

### Evidencia tecnica

- Documento operativo creado y alineado al estado actual del repositorio.
- Suites y smoke-test ya validados en puntos 12-13.

## Estado actualizado

- Punto 14: AVANZADO Y VALIDADO

## Siguiente punto

Opcional: automatizar el checklist completo en un script unico (`preflight:local`) para ejecucion one-shot.

## Actualizacion Punto 15

Se automatiza el checklist completo en ejecucion one-shot:

1. Nuevo script `scripts/preflight-local.ps1` con secuencia fail-fast:
- `docker:up`
- `smoke:local`
- `pnpm --filter @pac/api typecheck`
- `pnpm --filter @pac/api test:unit`
- `pnpm --filter @pac/api test:e2e`
2. Nuevo comando raiz:
- `pnpm preflight:local`
3. Documentacion actualizada:
- `README.md` (seccion preflight one-shot)
- `docs/CHECKLIST-PRE-RELEASE-LOCAL.md` (seccion de automatizacion)

### Evidencia tecnica

- `pnpm.cmd preflight:local` -> PASS

## Estado actualizado

- Punto 15: AVANZADO Y VALIDADO

## Siguiente punto

Definir criterio de salida de MacroFase 2 y preparar acta de cierre (pendientes, riesgos residuales y handoff a siguiente macrofase).

## Actualizacion Punto 16

Se emite acta formal de cierre de MacroFase 2:

1. Documento generado: `docs/ACTA-CIERRE-MACROFASE-2.md`.
2. Incluye:
- criterio de salida Go/No-Go,
- riesgos residuales clasificados,
- handoff operativo a siguiente macrofase.
3. Decision de cierre:
- MacroFase 2 cerrada con estado **GO para continuidad de desarrollo**.

## Estado actualizado

- Punto 16: AVANZADO Y VALIDADO

## Siguiente punto

Planificar MacroFase 3: objetivos, alcance y secuencia de entregables funcionales priorizados.

## Actualizacion Punto 17

Se prepara propuesta inicial de MacroFase 3 con enfoque ejecutivo-operativo:

1. Documento generado: `docs/PROPUESTA-INICIAL-MACROFASE-3.md`.
2. Contenido incluido:
- objetivos de macrofase,
- alcance en/fuera,
- secuencia recomendada por bloques,
- tabla de actividades ejecutables (ID, entregable, dependencias, criterio),
- criterio de salida propuesto para cierre de MF3.
3. Handoff:
- MacroFase 2 queda enlazada formalmente con plan de arranque inmediato de MF3.

## Estado actualizado

- Punto 17: AVANZADO Y VALIDADO

## Siguiente punto

Iniciar MacroFase 3 - Bloque A, Actividad M3-A1 (`BACKLOG-M3-FUNCIONAL.md`).
