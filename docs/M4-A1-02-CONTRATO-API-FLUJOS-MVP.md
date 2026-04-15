# M4-A1-02 - Contrato API de Flujos Criticos MVP

## Contexto

Contrato API alineado al estado actual de backend para los 5 flujos criticos definidos en M4-A1-01.

Base URL: `/api/v1`  
Formato de error estandar:  

```json
{
  "code": "ERROR_CODE",
  "message": "Descripcion"
}
```

Codigos de error estandar disponibles:

- `INVALID_PARAM`
- `INVALID_PAYLOAD`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `RATE_LIMITED`
- `NOT_FOUND`
- `CONFLICT`
- `UNPROCESSABLE_ENTITY`
- `INTERNAL_ERROR`

---

## F1 - Acceso seguro y contexto de usuario

### 1) Login

**Endpoint**  
`POST /auth/login`

**Request**

```json
{
  "email": "admin@pac.local",
  "password": "secret"
}
```

**200 OK (resumen)**

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@pac.local",
    "fullName": "Admin",
    "initials": "AD",
    "roles": ["ADMIN"],
    "permissions": ["workflow.read", "expedientes.change_state"]
  },
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

**Errores esperados**

- `400 INVALID_PAYLOAD` (email/password faltantes o vacios)
- `401 UNAUTHENTICATED` (credenciales invalidas)
- `429 RATE_LIMITED` (limite excedido en auth.login)
- `500 INTERNAL_ERROR`

### 2) Perfil de usuario autenticado

**Endpoint**  
`GET /auth/me`

**Headers**  
`Authorization: Bearer <accessToken>`

**200 OK**

```json
{
  "id": "uuid",
  "email": "admin@pac.local",
  "fullName": "Admin",
  "initials": "AD",
  "roles": ["ADMIN"],
  "permissions": ["workflow.read", "expedientes.change_state"]
}
```

**Errores esperados**

- `401 UNAUTHENTICATED` (token ausente, mal formado, invalido o expirado)
- `404 NOT_FOUND` (usuario no encontrado o inactivo)

### 3) Refresh de sesion

**Endpoint**  
`POST /auth/refresh`

**Request**

```json
{
  "refreshToken": "jwt"
}
```

**200 OK**

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}
```

**Errores esperados**

- `400 INVALID_PAYLOAD`
- `401 UNAUTHENTICATED` (refresh invalido, expirado, revocado o replay)
- `429 RATE_LIMITED` (limite excedido en auth.refresh)
- `500 INTERNAL_ERROR`

---

## F2 - Consulta operativa del expediente

### 4) Resumen operativo de expediente

**Endpoint**  
`GET /expedientes/:id`

**Headers**  
`Authorization: Bearer <accessToken>`

**Permiso**  
`workflow.read` (con politica de scope)

**200 OK**

```json
{
  "expedienteId": "EXP-010",
  "estadoActual": "EN_REVISION",
  "etapaActual": "REVISION_TECNICA",
  "responsableActual": {
    "id": "uuid",
    "nombre": "Usuario"
  },
  "actualizadoEn": "2026-04-14T18:00:00.000Z"
}
```

**Errores esperados**

- `400 INVALID_PARAM`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `500 INTERNAL_ERROR`

---

## F3 - Lectura de workflow e historial de estados

### 5) Workflow de expediente

**Endpoint**  
`GET /expedientes/:id/workflow`

**Headers**  
`Authorization: Bearer <accessToken>`

**Permiso**  
`workflow.read` (con politica de scope)

**200 OK (resumen)**

```json
{
  "expedienteId": "EXP-001",
  "estadoActual": "EN_REVISION",
  "etapas": []
}
```

**Errores esperados**

- `400 INVALID_PARAM`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `500 INTERNAL_ERROR`

### 6) Historial de estados

**Endpoint**  
`GET /expedientes/:id/history?page=1&pageSize=20&scope=all`

**Headers**  
`Authorization: Bearer <accessToken>`

**Permiso**  
`workflow.read` (con politica de scope)

**200 OK (resumen)**

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 2,
  "items": [
    {
      "id": "uuid",
      "scope": "global",
      "estadoAnterior": "INGRESADO",
      "estadoNuevo": "EN_REVISION",
      "changedAt": "2026-04-14T18:00:00.000Z"
    }
  ]
}
```

**Errores esperados**

- `400 INVALID_PARAM` (page/pageSize/scope invalidos)
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `500 INTERNAL_ERROR`

---

## F4 - Cambio de estado del expediente (accion critica)

### 7) Cambio de estado

**Endpoint**  
`POST /expedientes/:id/change-state`

**Headers**  
`Authorization: Bearer <accessToken>`

**Permiso**  
`expedientes.change_state` (con politica de scope)

**Request**

```json
{
  "estadoNuevo": "EN_REVISION",
  "comentario": "Cambio por validacion documental."
}
```

**200 OK (resumen)**

```json
{
  "expedienteId": "EXP-002",
  "estadoAnterior": "INGRESADO",
  "estadoNuevo": "EN_REVISION",
  "changedAt": "2026-04-14T18:00:00.000Z",
  "message": "Estado de expediente actualizado correctamente."
}
```

**Errores esperados**

- `400 INVALID_PARAM` / `INVALID_PAYLOAD`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT` (transicion invalida)
- `422 UNPROCESSABLE_ENTITY` (precondiciones no cumplidas)
- `500 INTERNAL_ERROR`

---

## F5 - Reapertura de etapa (accion critica correctiva)

### 8) Reapertura de etapa

**Endpoint**  
`POST /expedientes/:id/reopen-stage`

**Headers**  
`Authorization: Bearer <accessToken>`

**Permiso**  
`workflow.reopen_stage` (con politica de scope)

**Request**

```json
{
  "etapa": "REVISION_TECNICA",
  "motivo": "Reapertura por hallazgo posterior."
}
```

**200 OK (resumen)**

```json
{
  "expedienteId": "EXP-003",
  "etapa": "REVISION_TECNICA",
  "reopenedAt": "2026-04-14T18:00:00.000Z",
  "message": "Etapa reabierta correctamente."
}
```

**Errores esperados**

- `400 INVALID_PARAM` / `INVALID_PAYLOAD`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT` (reapertura no valida por estado)
- `422 UNPROCESSABLE_ENTITY` (precondiciones no cumplidas)
- `500 INTERNAL_ERROR`

---

## Reglas transversales para UI

1. UI debe tratar `409` como conflicto de transicion (mostrar regla de negocio).
2. UI debe tratar `422` como incumplimiento de precondiciones (mostrar acciones pendientes).
3. UI debe tratar `401/403` como control de acceso (sesion o permisos).
4. Todo error consumido desde UI debe leerse por `code` y `message`.

## Estandar UX de errores (M4-B2 aplicado)

Este contrato adopta, ademas, el comportamiento UX accionable definido en M4-B2:

1. `404 NOT_FOUND`
- inbox/detalle: "Expediente no encontrado. Verifique ID activo."
- `reopen-stage`: "Etapa no existe en expediente. Revise tabla de workflow."

2. `409 CONFLICT`
- `change-state`: "Transicion de estado invalida. Revise secuencia permitida."
- `reopen-stage`: "La etapa no puede reabrirse desde estado actual."

3. `422 UNPROCESSABLE_ENTITY`
- `change-state`: "Precondiciones no cumplidas. Revise bloqueos activos (alertas/NC)."

4. `401 UNAUTHENTICATED`
- "Token invalido o expirado. Renovar token y reintentar."

5. `403 FORBIDDEN`
- "No autorizado. Verifique permisos del rol."

6. `400 INVALID_PAYLOAD/INVALID_PARAM`
- "Entrada invalida. Revisar campos y formato."
