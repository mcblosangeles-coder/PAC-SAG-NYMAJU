# M3-F1 - Checklist de Deploy Productivo

## 1) Pre-deploy

1. `main` actualizado y sin cambios locales pendientes.
2. Migraciones Prisma revisadas y compatibles con backward/forward deploy.
3. Variables de entorno productivas cargadas:
- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET` (>= 32 chars)
- `JWT_REFRESH_SECRET` (>= 32 chars)
- `CORS_ALLOWED_ORIGINS` (sin wildcard, sin localhost)
- `METRICS_TOKEN`

## 2) Gate tecnico obligatorio

Ejecutar:

```bash
pnpm preflight:ci
```

Debe validar en un solo flujo:

1. lint global,
2. typecheck API,
3. unit tests API,
4. e2e tests API,
5. build web.

## 3) Despliegue

1. Aplicar migraciones con `prisma migrate deploy`.
2. Desplegar API y web en ventana controlada.
3. Confirmar boot correcto sin errores de validacion de entorno.

## 4) Post-deploy inmediato (smoke)

1. `GET /api/v1/health` -> `200`.
2. Login/refresh/logout funcional.
3. Endpoints internos protegidos con `x-metrics-token`.
4. Headers de seguridad presentes:
- `x-content-type-options`
- `x-frame-options`
- `content-security-policy`
- `strict-transport-security` (solo production)

## 5) Observabilidad y alertas

1. Revisar snapshot en `/api/v1/internal/metrics`.
2. Revisar estado de alertas en `/api/v1/internal/alerts/operational`.
3. Confirmar que no existan metricas en estado critico sostenido.

## 6) Rollback (si aplica)

1. Mantener version anterior disponible para rollback inmediato.
2. Criterios de rollback:
- aumento sostenido de 5xx,
- falla auth critica,
- degradacion severa de latencia sin mitigacion.
3. Ejecutar rollback y registrar evidencia en acta.

## 7) Cierre de despliegue

1. Registrar hora de inicio/fin.
2. Registrar commit/tag desplegado.
3. Registrar resultado de smoke y metricas operativas.
4. Confirmar estado final: estable / degradado / rollback.

## 8) Evidencia de riesgos residuales (R1-R3)

Antes de cierre productivo, dejar evidencia en acta de:

1. R1 (rate limit en memoria):
- comportamiento esperado de umbral `429`,
- confirmacion de no persistencia tras reinicio de proceso.
2. R2 (trust proxy/ip real):
- verificacion controlada de `X-Forwarded-For`,
- confirmacion de politica de proxy confiable en infraestructura.
3. R3 (token interno):
- `403` sin token,
- `403` token invalido,
- `200` token valido,
- plan de rotacion documentado.
