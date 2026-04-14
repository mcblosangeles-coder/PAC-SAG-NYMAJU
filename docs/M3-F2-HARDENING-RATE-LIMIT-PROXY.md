# M3-F2 - Hardening de Rate Limit Distribuido y Proxy Confiable

## Objetivo

Cerrar riesgos residuales:

1. **R1**: rate limiting en memoria no persistente/no distribuido.
2. **R2**: dependencia de `TRUST_PROXY` sin lista de borde confiable.

## Cambios implementados

### 1) Rate limiting distribuido en Redis

- middleware `apps/api/src/middlewares/rate-limit.ts` usa Redis como store distribuido.
- contador atomico por llave:
  - `INCR`,
  - `EXPIRE`,
  - `TTL`.
- respuesta `429` con `Retry-After`.

### 2) Politica de store y degradacion

Variables nuevas:

- `RATE_LIMIT_STORE=redis|memory` (default: `redis`)
- `RATE_LIMIT_REQUIRE_REDIS=true|false` (default recomendado en prod: `true`)

Comportamiento:

1. Si `RATE_LIMIT_STORE=redis` y Redis disponible -> store distribuido.
2. Si Redis falla y `RATE_LIMIT_REQUIRE_REDIS=true` -> `503` (fail-safe).
3. Si Redis falla y `RATE_LIMIT_REQUIRE_REDIS=false` -> fallback temporal a memoria con warning.

### 3) Hardening de proxy de borde

Variables nuevas:

- `TRUST_PROXY=true|false`
- `TRUSTED_PROXY_CIDRS=<csv>`

Regla estricta:

- En `production`, si `TRUST_PROXY=true`, `TRUSTED_PROXY_CIDRS` es obligatorio.

Aplicacion:

- `app.ts` configura `trust proxy` con lista CIDR cuando existe.

### 4) Bootstrap de seguridad en startup

- `main.ts` valida conectividad Redis en arranque cuando corresponde.
- en modo estricto, la API no opera si Redis no cumple conectividad.
- cierre ordenado desconecta Redis y Prisma.

## Variables de entorno (resumen)

```env
TRUST_PROXY=false
TRUSTED_PROXY_CIDRS=
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis
RATE_LIMIT_REQUIRE_REDIS=false
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_AUTH_LOGIN_MAX=10
RATE_LIMIT_AUTH_REFRESH_MAX=20
RATE_LIMIT_INTERNAL_MAX=120
```

## Evidencia de validacion

- `pnpm.cmd preflight:ci` -> OK
- `lint` -> OK
- `@pac/api typecheck` -> OK
- `@pac/api test:unit` -> OK
- `@pac/api test:e2e` -> OK (`38/38`)
- `@pac/web build` -> OK

## Riesgo residual

1. Si se configura fallback (`RATE_LIMIT_REQUIRE_REDIS=false`), persiste riesgo parcial R1 durante indisponibilidad Redis.
2. La efectividad de R2 depende de que infraestructura (LB/WAF) alinee `X-Forwarded-For` con `TRUSTED_PROXY_CIDRS`.

## Recomendacion de salida a produccion

1. `RATE_LIMIT_STORE=redis`
2. `RATE_LIMIT_REQUIRE_REDIS=true`
3. `TRUST_PROXY=true`
4. `TRUSTED_PROXY_CIDRS` con CIDR reales de edge/LB
