# M3-D2 - DIAGNOSTICO TECNICO DE LOGGING OPERATIVO

## Fecha
2026-04-14

## Objetivo

Evaluar estado real del logging API tras M3-D1 para cerrar brechas operativas de M3-D2:

1. gobierno de eventos,
2. control de volumen/costo,
3. seguridad de datos en logs,
4. alineacion con observabilidad y SIEM.

## Alcance revisado

- `apps/api/src/lib/logger.ts`
- `apps/api/src/app.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `docs/ACTA-AVANCE-MACROFASE-3.md`
- `docs/CHECKLIST-CIERRE-BLOQUE-B-M3.md`

## Hallazgos tecnicos (estado actual)

### 1) Formato estructurado JSON

Estado: CUMPLIDO

- Existe logger comun con campos base estables: `timestamp`, `level`, `service`, `environment`, `event`, `message`, `context`.
- `context` ya esta anidado, evitando colision de claves de primer nivel.

### 2) Correlacion por request id

Estado: CUMPLIDO

- Se acepta `x-request-id` de entrada y se sanea por regex y largo maximo.
- Si no cumple reglas, se genera UUID.
- Se devuelve `x-request-id` en respuesta y se usa en logs de inicio/fin/error de request.

### 3) Cobertura de eventos

Estado: PARCIAL

- Eventos implementados y visibles:
  - `api.started`
  - `http.request.started`
  - `http.request.completed`
  - `http.request.failed`
  - `audit.log.failed_non_blocking`
- En auth existe auditoria persistida en BD (`auth.login`, `auth.refresh`, etc.), pero no existe aun catalogo formal unico de eventos para logs de salida de proceso.

### 4) Riesgo de volumen operativo

Estado: ABIERTO

- Actualmente hay 2 logs por request exitoso (`started` + `completed`), mas eventos de error/auditoria.
- No existe politica por entorno para reducir ruido en produccion (ej. suprimir `started` o aplicar sampling).

### 5) Riesgo de datos sensibles

Estado: PARCIAL

- No se observa logging directo de `password`, `refreshToken` o `authorization` en puntos revisados.
- No existe politica formal escrita de redaccion/mascaramiento para futuras incorporaciones.

### 6) Gobernanza operacional

Estado: ABIERTO

- No hay documento oficial con:
  - niveles minimos por entorno,
  - contrato de campos obligatorios por evento,
  - retencion/rotacion,
  - mapeo de severidades para SIEM.

## Diagnostico consolidado

M3-D1 resolvio la emision tecnica de logs estructurados. M3-D2 aun requiere cierre de gobernanza operativa:

1. politica de logging por entorno,
2. catalogo oficial de eventos,
3. politica de retencion e integracion SIEM.

Sin esos 3 puntos, el sistema es funcional para debugging local, pero todavia fragil para operacion productiva y auditoria sostenida.

## Decisiones recomendadas para cierre M3-D2

1. Definir nivel minimo:
- `development`: `info`
- `test`: `warn` (permitiendo override cuando se requiera)
- `production`: `info` con opcion de `warn` temporal en alta carga

2. Politica de volumen:
- mantener `http.request.completed` siempre,
- volver `http.request.started` opcional por entorno,
- incorporar sampling configurable para endpoints de alta frecuencia.

3. Seguridad de logs:
- prohibir explicitamente log de secretos (`password`, `authorization`, tokens completos),
- permitir solo hashes/ids tecnicos cuando aplique.

4. Catalogo de eventos:
- estandarizar namespaces: `http.*`, `auth.*`, `audit.*`, `workflow.*`, `db.*`.
- definir campos obligatorios por tipo.

5. Operacion/SIEM:
- formalizar retencion por tipo de evento (operativo vs seguridad),
- mapear `level -> severidad SIEM`.

## Criterio de salida propuesto para M3-D2

M3-D2 se considera cerrado cuando existan y esten validados:

1. `docs/M3-D2-POLITICA-LOGGING.md`
2. `docs/M3-D2-CATALOGO-EVENTOS-API.md`
3. `docs/M3-D2-RETENCION-Y-SIEM.md`
4. ajuste minimo en codigo para politica por entorno (si se aprueba en esta iteracion).
