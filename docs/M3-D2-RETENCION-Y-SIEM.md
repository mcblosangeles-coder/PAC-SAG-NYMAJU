# M3-D2 - RETENCION Y PREPARACION SIEM

## Objetivo

Definir reglas minimas de retencion y compatibilidad SIEM para logging operativo del API, sin integrar aun una plataforma SIEM especifica.

## Salida estandar

- Salida principal: `stdout`/`stderr` en JSON estructurado.
- El runtime/collector externo es responsable de:
  - captura,
  - transporte,
  - indexacion,
  - retencion final.

## Mapeo `level -> severidad SIEM`

- `debug` -> `Low`
- `info` -> `Informational`
- `warn` -> `Medium`
- `error` -> `High`

Nota:
- Si un evento representa incidente de seguridad confirmado, puede escalarse a `Critical` por regla SIEM aguas abajo.

## Retencion recomendada por tipo de evento

### Operativos generales (`http.*`, `db.*`, `jobs.*`, `storage.*`)

- Retencion online: 30 dias
- Retencion fria/archivo: hasta 90 dias (opcional segun costo)

### Seguridad y acceso (`auth.*`, errores de autorizacion/autenticacion)

- Retencion online: 90 dias
- Retencion fria/archivo: 180 dias

### Fallas de auditoria (`audit.log.failed_non_blocking`)

- Retencion online: 180 dias
- Retencion fria/archivo: 365 dias

## Restricciones de datos sensibles para observabilidad

Prohibido transportar en logs (a collector/SIEM):

- passwords
- tokens completos
- headers de autorizacion
- cookies de sesion
- secretos y claves privadas

Permitido:

- ids tecnicos,
- hashes,
- metadatos operativos no sensibles.

## Integracion futura con collector/SIEM

Cuando se conecte SIEM real, implementar:

1. parser JSON con schema fijo de evento,
2. enrichment de infraestructura (host, container, region),
3. alertas minimas:
   - pico de `http.request.failed`,
   - repeticion de `auth.refresh_replay_detected`,
   - ocurrencia de `audit.log.failed_non_blocking`,
4. dashboards base:
   - latencia por endpoint,
   - tasa de errores,
   - eventos de seguridad por ventana.

## Criterio operativo minimo (MVP)

Se considera compatible con SIEM cuando:

1. logs salen por stdout en JSON consistente,
2. existe mapeo de severidad documentado,
3. existe retencion por categorias,
4. hay prohibicion explicita de datos sensibles.
