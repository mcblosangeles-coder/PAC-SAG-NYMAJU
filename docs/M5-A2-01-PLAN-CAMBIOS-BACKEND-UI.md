# M5-A2-01 - Plan de cambios backend/UI (BR-001/002/003/006/008)

## Objetivo

Definir el plan de implementación técnico para cerrar brechas P1 de operación sobre F1-F5, con cambios concretos en API y UI.

## Brechas incluidas (P1)

1. BR-001: perfil de autenticación por entorno (QA/PROD) y bloqueo de credenciales por defecto en producción.
2. BR-002: manejo de expiración/refresh de sesión en UI operativa.
3. BR-003: bandeja operativa con búsqueda/filtro (sin depender de IDs manuales).
4. BR-006: respuesta `422` enriquecida con detalle estructurado de bloqueos activos.
5. BR-008: reapertura de etapa mediante selector dinámico de etapas disponibles.

## Estado base actual

1. API expone F1-F5 con semántica de errores estable.
2. UI M4-B1 soporta login integrado, bandeja por IDs manuales y acciones F4/F5.
3. Dataset operativo oficial ya está estandarizado (M5-B1-01/B1-02).

## Diseño de cambios

### A) Backend (API)

#### A1) Nuevo endpoint de bandeja operativa (BR-003)

**Endpoint propuesto**
- `GET /api/v1/expedientes`

**Query params**
- `q` (opcional): búsqueda por `codigoInterno`/`id`
- `estadoGlobal` (opcional)
- `responsableUserId` (opcional)
- `page` (default `1`)
- `pageSize` (default `20`, max `100`)

**Respuesta 200**
- listado paginado de resumen operativo (`expedienteId`, `codigoInterno`, `estadoGlobal`, `responsableActual`, `bloqueos`, `canAdvance`, `updatedAt`).

**Errores**
- `400 INVALID_PARAM` (filtros inválidos)
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `500 INTERNAL_ERROR`

**Archivos objetivo**
- `apps/api/src/routes/expedientes.routes.ts`
- `apps/api/src/modules/expedientes/expedientes.service.ts`

---

#### A2) Enriquecer respuesta `422` en `change-state` (BR-006)

**Cambio**
- mantener `code=UNPROCESSABLE_ENTITY` y agregar `details` con:
  - `blockingAlertsCount`
  - `blockingNcCount`
  - `blockingReasons` (máximo N elementos; tipo, id, severidad, titulo/codigo)

**Estructura sugerida**
```json
{
  "code": "UNPROCESSABLE_ENTITY",
  "message": "Precondicion de workflow no cumplida...",
  "details": {
    "blockingAlertsCount": 1,
    "blockingNcCount": 0,
    "blockingReasons": [
      { "type": "ALERTA", "id": "...", "severity": "CRITICA", "title": "..." }
    ]
  }
}
```

**Archivos objetivo**
- `apps/api/src/modules/expedientes/expedientes.service.ts`
- `apps/api/src/routes/expedientes.routes.ts`
- `apps/api/src/lib/api-error.ts` (si se requiere soporte de `details`)

---

#### A3) Opciones de reapertura para UI (BR-008)

**Estrategia mínima recomendada**
- reutilizar `GET /expedientes/:id/workflow` para construir en UI el selector de etapas reabribles, sin nuevo endpoint.

**Regla de elegibilidad UI**
- etapas cuyo `estadoEtapa` esté en:
  - `CERRADA`
  - `RECHAZADA`
  - `VENCIDA`
  - `BLOQUEADA`
  - `OBSERVADA`

**Cambio opcional backend (si se requiere contrato explícito)**
- `GET /expedientes/:id/reopen-options` con lista filtrada de etapas candidatas.

### B) Frontend (UI)

#### B1) Perfil de autenticación por entorno (BR-001)

**Cambios**
- agregar selector `Perfil`: `QA` / `PROD`.
- en `production`:
  - no precargar `admin@pac.local` ni password por defecto;
  - validar credenciales no vacías antes de login.
- en `development/qa`:
  - permitir valores por defecto configurables vía env.

**Archivos objetivo**
- `apps/web/src/App.tsx`

---

#### B2) Expiración y refresh de sesión (BR-002)

**Cambios**
- almacenar `refreshToken` del login operativo.
- decodificar `exp` del `accessToken` para mostrar estado de sesión.
- cuando `accessToken` esté próximo a expirar:
  - intentar `POST /auth/refresh` de forma transparente;
  - fallback a mensaje de reautenticación.
- actualizar token en memoria + storage tras refresh.

**Archivos objetivo**
- `apps/web/src/App.tsx`

---

#### B3) Bandeja con filtros (BR-003)

**Cambios**
- agregar formulario de filtros:
  - `q`, `estadoGlobal`, `responsableUserId`, `page`, `pageSize`.
- consumir `GET /expedientes` para llenar bandeja.
- mantener modo manual por IDs como fallback operativo.

**Archivos objetivo**
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`

---

#### B4) Mensajería `422` accionable con detalle (BR-006)

**Cambios**
- si existe `details.blockingReasons`, mostrar tabla/lista de bloqueos en panel de acción.
- mantener compatibilidad con formato anterior (sin `details`).

**Archivos objetivo**
- `apps/web/src/App.tsx`

---

#### B5) Selector dinámico de etapa para F5 (BR-008)

**Cambios**
- reemplazar input libre de etapa por `select` alimentado desde workflow.
- si no hay etapas reabribles, deshabilitar acción y mostrar motivo.

**Archivos objetivo**
- `apps/web/src/App.tsx`

## Secuencia de implementación recomendada

1. API A1 (`GET /expedientes`) + tests.
2. API A2 (`422` con `details`) + tests.
3. UI B3 (bandeja filtros) sobre A1.
4. UI B5 (selector dinámico etapa) usando workflow actual.
5. UI B4 (render de `details` en errores 422).
6. UI B1 (perfil QA/PROD) + B2 (refresh/expiración sesión).

## Pruebas requeridas

### API

1. `GET /expedientes`:
- filtro por `q`, por `estadoGlobal`, paginación.
- validación de `400` en parámetros inválidos.

2. `POST /change-state` `422`:
- assert de estructura `details` y conteos.

### UI

1. login por perfil:
- QA permite defaults.
- PROD no permite defaults ni envío vacío.

2. sesión:
- aviso de expiración y/o refresh correcto.

3. bandeja:
- carga por filtro sin IDs manuales.

4. reapertura:
- selector solo con etapas elegibles.

5. error 422:
- visualización de bloqueos estructurados.

## Criterio de aceptación M5-A2-01

1. BR-001/002/003/006/008 implementadas o cubiertas sin brecha operativa abierta.
2. tests API asociados en verde.
3. `pnpm --filter @pac/web typecheck` y `pnpm --filter @pac/web build` en verde.
4. evidencia funcional UI/API registrada en acta M5.

## Riesgos técnicos de implementación

1. acoplar demasiada lógica de sesión en un solo componente `App.tsx`.
2. romper compatibilidad de errores si `details` no se maneja backward-compatible.
3. sobrecarga de consultas en bandeja si filtros/paginación no se limitan.

Mitigación:

1. cambios incrementales por bloque;
2. mantener compatibilidad de contrato actual;
3. limitar `pageSize` y validar parámetros en API.

Estado: **PLAN DEFINIDO, LISTO PARA IMPLEMENTACION**.
