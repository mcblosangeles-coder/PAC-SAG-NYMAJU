# M3-D2 - POLITICA DE LOGGING OPERATIVO API

## Proposito

Definir reglas operativas de logging para el API del MVP, garantizando:

1. trazabilidad tecnica,
2. control de volumen/costo,
3. proteccion de datos sensibles,
4. compatibilidad con observabilidad y SIEM.

## Alcance

- Logging operativo JSON emitido por stdout/stderr.
- Eventos API en namespaces `http.*`, `auth.*`, `audit.*`, `workflow.*`, `db.*`, `jobs.*`, `storage.*`.
- No reemplaza ni modifica la auditoria persistida en `AuditLog`.

## Contrato de log obligatorio

Cada evento debe emitir:

- `timestamp`
- `level`
- `service`
- `environment`
- `event`
- `message`
- `context`
- `requestId` cuando aplique

## Niveles minimos por entorno

### development

- `LOG_LEVEL_MIN=info` (default)
- `http.request.started`: habilitado por defecto
- `http.request.completed`: habilitado
- `http.request.failed`: habilitado

### test

- `LOG_LEVEL_MIN=warn` por defecto (override permitido)
- `http.request.started`: deshabilitado por defecto
- mantener errores y eventos criticos

### production

- `LOG_LEVEL_MIN=info` por defecto
- `http.request.started`: deshabilitado por defecto
- `http.request.completed`: habilitado
- se puede elevar temporalmente a `warn` para control de volumen

## Reglas de volumen y costo

1. Soporte de exclusion por ruta:
- `LOG_EXCLUDE_PATH_PATTERNS` (wildcards `*`), ejemplo:
  - `/api/v1/health,/api/v1/polling/*`

2. Soporte de sampling HTTP global:
- `LOG_HTTP_SAMPLE_RATE` (`0..1`) para `http.request.started` y `http.request.completed`.

3. Soporte de sampling por patron de ruta:
- `LOG_HTTP_PATH_SAMPLE_RULES` con formato `pattern=rate`, separados por coma.
- ejemplo:
  - `/api/v1/health=0,/api/v1/expedientes/*=0.2`

4. Restricciones:
- no aplicar sampling a:
  - errores (`*.failed` con `level=error`),
  - eventos de seguridad,
  - eventos de auditoria,
  - eventos criticos de workflow.

## Reglas de sanitizacion/redaccion

Antes de emitir un log se debe sanitizar contexto:

- prohibido registrar directamente:
  - `password`
  - `authorization`
  - `accessToken`
  - `refreshToken`
  - cookies de sesion
  - secretos/claves
- valores sensibles se reemplazan por `"[REDACTED]"`.
- permitir solo:
  - ids tecnicos,
  - hashes,
  - prefijos truncados cuando sea estrictamente necesario.

No registrar payloads completos de credenciales.

## Reglas de request-id

- Header de entrada: `x-request-id`.
- Se sanea por patron y longitud maxima.
- Si no cumple validacion, se genera UUID.
- Debe propagarse en respuesta y registrarse en eventos HTTP.

## Separacion de responsabilidades

- Logging operativo JSON:
  - observabilidad, debugging y monitoreo en runtime.
- Auditoria persistida (`AuditLog`):
  - trazabilidad funcional/compliance en base de datos.

Ninguno sustituye al otro.

## Criterios de cambio

Cualquier cambio en politica de logging debe:

1. actualizar este documento,
2. actualizar catalogo de eventos (`M3-D2-CATALOGO-EVENTOS-API.md`),
3. validar impacto en costos/volumen y seguridad de datos.
