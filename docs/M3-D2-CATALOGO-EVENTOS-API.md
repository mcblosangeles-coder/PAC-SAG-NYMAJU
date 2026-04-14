# M3-D2 - CATALOGO DE EVENTOS API

## Namespaces aprobados

- `http.*`
- `auth.*`
- `audit.*`
- `workflow.*`
- `db.*`
- `jobs.*`
- `storage.*`

## Contrato minimo por evento

Campos obligatorios:

- `timestamp`
- `level`
- `service`
- `environment`
- `event`
- `message`
- `context`

Campo obligatorio cuando aplique:

- `requestId` (rutas HTTP y flujos correlacionables por request)

## Eventos iniciales implementados

### HTTP

- `http.server.started`
- `http.request.started`
- `http.request.completed`
- `http.request.failed`

### AUDIT (operativo)

- `audit.log.failed_non_blocking`

### AUTH (auditoria persistida en BD, no stdout por defecto)

- `auth.login`
- `auth.login_failed`
- `auth.refresh`
- `auth.refresh_failed`
- `auth.refresh_replay_detected`
- `auth.logout`
- `auth.logout_failed`

## Eventos planificados (siguiente iteracion)

- `workflow.transition.requested`
- `workflow.transition.rejected`
- `workflow.transition.applied`
- `db.query.slow`
- `jobs.run.started`
- `jobs.run.completed`
- `storage.file.uploaded`

## Ejemplos JSON por familia

### http.*

```json
{
  "timestamp": "2026-04-14T05:00:00.000Z",
  "level": "info",
  "service": "@pac/api",
  "environment": "production",
  "event": "http.request.completed",
  "message": "API request completed.",
  "requestId": "3e241940-78e4-4a95-8846-2f9de5e4bf30",
  "context": {
    "requestId": "3e241940-78e4-4a95-8846-2f9de5e4bf30",
    "method": "GET",
    "path": "/api/v1/expedientes/EXP-001",
    "statusCode": 200,
    "durationMs": 24.71
  }
}
```

### auth.* (formato recomendado para evento operativo futuro)

```json
{
  "timestamp": "2026-04-14T05:01:00.000Z",
  "level": "warn",
  "service": "@pac/api",
  "environment": "production",
  "event": "auth.refresh_failed",
  "message": "Refresh token rejected.",
  "requestId": "84f32efe-ecdf-4afc-ae1e-c8702c5c7335",
  "context": {
    "requestId": "84f32efe-ecdf-4afc-ae1e-c8702c5c7335",
    "userId": "usr_001",
    "reason": "invalid_signature_or_claims"
  }
}
```

### audit.*

```json
{
  "timestamp": "2026-04-14T05:02:00.000Z",
  "level": "error",
  "service": "@pac/api",
  "environment": "production",
  "event": "audit.log.failed_non_blocking",
  "message": "Audit log failed in non-blocking mode.",
  "context": {
    "accion": "auth.login",
    "userId": "usr_001",
    "expedienteId": null,
    "scopeType": null,
    "scopeId": null,
    "errorName": "PrismaClientKnownRequestError",
    "errorMessage": "Write failed"
  }
}
```

### workflow.* (formato recomendado)

```json
{
  "timestamp": "2026-04-14T05:03:00.000Z",
  "level": "info",
  "service": "@pac/api",
  "environment": "production",
  "event": "workflow.transition.applied",
  "message": "Workflow transition applied.",
  "requestId": "6f2e7f11-a9aa-4af8-9d58-f6e6d35f41e2",
  "context": {
    "requestId": "6f2e7f11-a9aa-4af8-9d58-f6e6d35f41e2",
    "expedienteId": "EXP-002",
    "fromState": "EN_PROCESO",
    "toState": "APROBADO"
  }
}
```
