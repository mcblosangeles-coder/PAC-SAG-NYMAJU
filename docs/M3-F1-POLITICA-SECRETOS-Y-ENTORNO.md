# M3-F1 - Politica de Secretos y Entorno

## Objetivo

Definir reglas operativas para manejo de variables de entorno, secretos y validaciones estrictas en produccion.

## Alcance

- API `@pac/api`
- Entornos `development`, `test`, `production`
- Variables de autenticacion, CORS, observabilidad y rate limiting

## Reglas obligatorias

1. No se versionan secretos reales en repositorio.
2. El archivo `.env.example` solo contiene placeholders seguros y valores no sensibles.
3. En `production` la API debe fallar al iniciar si faltan variables criticas.
4. Todo secreto productivo se gestiona fuera del repo (secret manager o variables de entorno del runtime).

## Validaciones estrictas por entorno

### Produccion

1. `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`:
- minimo 32 caracteres,
- no placeholders (`replace_in_local_env`, `ci_*`).
2. `METRICS_TOKEN`:
- obligatorio para proteger endpoints internos.
3. CORS:
- `CORS_ALLOWED_ORIGINS` obligatorio,
- prohibido `*`,
- prohibido `localhost` y `127.0.0.1`.
4. `NODE_ENV`:
- solo se acepta `development|test|production`.

### Test

1. `RATE_LIMIT_ENABLED` por defecto en `false` para estabilidad de suite.
2. Colectores/evaluadores de jobs permitidos con override.

### Development

1. Defaults locales permitidos para acelerar bootstrap.
2. Secrets locales solo para entorno de trabajo (nunca para produccion).

## Variables M3-F1 incorporadas

- `TRUST_PROXY`
- `CORS_ALLOWED_ORIGINS`
- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_AUTH_LOGIN_MAX`
- `RATE_LIMIT_AUTH_REFRESH_MAX`
- `RATE_LIMIT_INTERNAL_MAX`

## Politica de rotacion de secretos

1. Rotar secretos JWT en cambios de personal, incidente o riesgo detectado.
2. Mantener ventana de despliegue controlada para evitar downtime de sesiones.
3. Registrar fecha de rotacion, responsable y ticket de cambio.

## Criterio de cumplimiento M3-F1

1. Arranque bloqueado si variables criticas no cumplen.
2. Endpoints sensibles protegidos por limitacion de tasa.
3. CORS y headers de seguridad configurados por ambiente.
4. Validacion automatica cubierta por gate CI.
