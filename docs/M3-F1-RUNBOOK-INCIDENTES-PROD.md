# M3-F1 - Runbook de Incidentes (Produccion)

## Objetivo

Estandarizar respuesta operativa ante incidentes de seguridad, disponibilidad o degradacion en produccion.

## Severidad

- **SEV-1**: caida total API, fuga de secretos, bypass de auth/RBAC.
- **SEV-2**: degradacion severa (p95 alta sostenida, 5xx recurrente, refresh failures altos).
- **SEV-3**: degradacion parcial o ruido operacional sin impacto critico.

## Flujo de respuesta

1. Detectar (alerta automatica, monitoreo, reporte usuario).
2. Clasificar severidad (SEV-1/2/3).
3. Contener impacto (throttle, rollback, aislamiento).
4. Recuperar servicio (fix, redeploy, validacion funcional).
5. Postmortem tecnico con causa raiz y acciones preventivas.

## Playbooks minimos

### Incidente de autenticacion (`/auth/login`, `/auth/refresh`)

1. Revisar tasa de `401`, `429`, `5xx` por endpoint.
2. Verificar integridad de secretos JWT y expiraciones.
3. Revisar estado de `UserSession` y eventos de replay.
4. Si hay ataque de fuerza bruta:
- bajar umbrales de rate limit temporalmente,
- bloquear origen en capa perimetral.

### Incidente de endpoints internos

1. Confirmar uso de `x-metrics-token`.
2. Rotar `METRICS_TOKEN` si se sospecha exposicion.
3. Verificar accesos inusuales en logs (`internal.*`).

### Incidente de CORS/headers

1. Confirmar `CORS_ALLOWED_ORIGINS` del entorno.
2. Revisar respuesta de headers de seguridad en health endpoint.
3. Revertir cambios de config de borde si se rompe consumo legitimo.

## Evidencia minima para cierre

1. Timestamp inicio/fin del incidente.
2. Impacto (usuarios, endpoints, ventana temporal).
3. Causa raiz confirmada.
4. Mitigacion aplicada.
5. Acciones correctivas con responsable y fecha.

## Comandos de apoyo

```bash
pnpm --filter @pac/api test:e2e
pnpm --filter @pac/api typecheck
pnpm --filter @pac/web build
pnpm preflight:ci
```

## Criterio de salida operativa

Se considera recuperado cuando:

1. salud y metricas vuelven a umbral esperado,
2. no hay errores criticos activos,
3. evidencia de verificacion tecnica en verde,
4. incidente documentado en acta/postmortem.
