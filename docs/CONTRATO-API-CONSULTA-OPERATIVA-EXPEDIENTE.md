# CONTRATO API - CONSULTA OPERATIVA DE EXPEDIENTE

## Fecha
2026-04-13

## Objetivo

Definir el contrato API para la consulta operativa principal de expediente en MacroFase 3.

## Endpoint propuesto

- Metodo: `GET`
- Ruta: `/api/v1/expedientes/:id`
- Autenticacion: Bearer JWT obligatoria
- Autorizacion: permiso `workflow.read` con policy de alcance (`self/module/all`)

## Request

### Path params

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `id` | `string` | Si | Identificador de expediente no vacio |

### Query params (v1)

No aplica en version inicial.

## Response 200 (exito)

```json
{
  "expedienteId": "EXP-001",
  "codigoInterno": "PAC-2026-001",
  "estadoGlobal": "DOCUMENTAL",
  "proyecto": {
    "id": "PROJ-01",
    "nombre": "Proyecto A"
  },
  "responsableActual": {
    "userId": "USR-01",
    "fullName": "Nombre Usuario"
  },
  "etapasResumen": [
    {
      "id": "ETP-01",
      "tipoEtapa": "REVISION_TECNICA",
      "estadoEtapa": "EN_PROGRESO",
      "dueAt": "2026-04-20T00:00:00.000Z"
    }
  ],
  "bloqueos": {
    "hasBlockingAlerts": false,
    "hasBlockingNc": true,
    "count": 1
  },
  "canAdvance": false,
  "updatedAt": "2026-04-13T20:00:00.000Z"
}
```

### Reglas de payload 200

1. `expedienteId`, `codigoInterno`, `estadoGlobal` siempre presentes.
2. `proyecto` y `responsableActual` pueden ser `null` si no existe relacion.
3. `etapasResumen` siempre arreglo (puede ser vacio).
4. `bloqueos.count` debe ser consistente con flags de bloqueo.
5. `canAdvance` debe estar alineado a reglas de bloqueos.

## Responses de error

### 400 INVALID_PARAM

Cuando `:id` es invalido o vacio.

```json
{
  "code": "INVALID_PARAM",
  "message": "Expediente invalido."
}
```

### 401 UNAUTHENTICATED

Sin token o token invalido/expirado.

```json
{
  "code": "UNAUTHENTICATED",
  "message": "Token invalido o expirado."
}
```

### 403 FORBIDDEN

Sin permiso o fuera de alcance RBAC.

```json
{
  "code": "FORBIDDEN",
  "message": "No autorizado por alcance.",
  "requiredPermission": "workflow.read",
  "scope": "self"
}
```

### 404 NOT_FOUND

Expediente inexistente o eliminado.

```json
{
  "code": "NOT_FOUND",
  "message": "Expediente no encontrado."
}
```

### 500 INTERNAL_ERROR

Fallo no controlado.

```json
{
  "code": "INTERNAL_ERROR",
  "message": "No fue posible obtener la consulta operativa del expediente."
}
```

## Criterios de aceptacion (M3-A2)

1. Endpoint implementado en ruta final `/api/v1/expedientes/:id`.
2. Contrato de errores consistente con catalogo `API_ERROR_CODE`.
3. Validacion de alcance RBAC activa para `workflow.read`.
4. Pruebas minimas:
- unit para mapeo de vista operativa,
- e2e para `200`, `400`, `401`, `403`, `404`.
5. Evidencia de cierre:
- `pnpm --filter @pac/api typecheck` en OK,
- suites relevantes en verde,
- registro en `ACTA-AVANCE-MACROFASE-3.md`.

## Notas de implementacion

1. En version inicial, puede reutilizar datos ya disponibles en `workflowService` y complementar con metadatos de proyecto/responsable.
2. Mantener respuestas de error en formato `code + message` para compatibilidad con estandar de MacroFase 2.
