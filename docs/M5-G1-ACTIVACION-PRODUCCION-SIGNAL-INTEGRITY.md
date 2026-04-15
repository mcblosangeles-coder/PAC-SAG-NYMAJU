# M5-G1 - Activacion Produccion / Signal Integrity

## Fecha
2026-04-15

## Objetivo
Activar y verificar en entorno productivo real la politica de perfilado de trafico (`x-traffic-profile`) para eliminar contaminacion de senal operacional y cerrar el pendiente `PND-M5-F2-PROD`.

## Alcance
1. Aplicacion de politica de borde (WAF/LB/Gateway) para inyeccion y rechazo de header.
2. Verificacion funcional minima en produccion:
- `400` para header invalido.
- `200` para trafico normal.
- `metrics` operacional consistente.
3. Confirmacion de integridad de senal con metrica `profile_header_valid_rate`.

## Fuera de alcance
1. Rediseño de arquitectura.
2. Nuevas funcionalidades de negocio.
3. Cambios de modelo de datos no relacionados al perfilado.

---

## Fase 1 - Precheck

### 1.1 Prerrequisitos
1. Endpoint API productivo operativo.
2. Acceso administrativo al borde (WAF/LB/Gateway).
3. `METRICS_TOKEN` operativo para endpoints internos.
4. Plan de rollback definido por infraestructura.

### 1.2 Configuracion objetivo (produccion)
1. `TRAFFIC_PROFILE_REJECT_ON_MISSING_HEADER=true`
2. `TRAFFIC_PROFILE_REJECT_ON_INVALID_HEADER=true`
3. `QA_INTERNAL_HOSTNAMES=<host_qa_si_aplica>`
4. `QA_INTERNAL_PATH_PREFIX=/api/v1/internal/qa`

### 1.3 Controles previos
1. Respaldar configuracion actual de borde.
2. Validar sintaxis/configuracion antes de aplicar cambios.
3. Confirmar que dashboards operativos consultan `profile=operational`.

### 1.4 Evidencia minima precheck
1. Captura de configuracion actual (o hash/version).
2. Registro de variables/flags activas.
3. Timestamp de inicio de ventana de cambio.

---

## Fase 2 - Cutover

### 2.1 Politica de borde a aplicar
1. Forzar `x-traffic-profile=operational` para host operacional.
2. Forzar `x-traffic-profile=validation` para host/ruta QA aislada.
3. Bloquear sobrescritura externa de header.
4. Rechazar valores no permitidos (`operational|validation`) con `400`.

### 2.2 Secuencia de activacion
1. Aplicar configuracion en borde.
2. Ejecutar validacion tecnica de config (`test config`) segun plataforma.
3. Recargar/publicar configuracion.
4. Confirmar salud de API post-cutover.

### 2.3 Criterio de rollback inmediato
Ejecutar rollback si ocurre cualquiera de estos casos:
1. `health` no responde `200` sostenido.
2. Incremento anomalo de `5xx`.
3. Bloqueo incorrecto de trafico legitimo operacional.

### 2.4 Evidencia minima cutover
1. ID/version de regla desplegada en borde.
2. Timestamp de aplicacion.
3. Resultado de validacion de configuracion.

---

## Fase 3 - Postcheck

### 3.1 Pruebas obligatorias de cierre
1. **Prueba A - Header invalido**  
Request con `x-traffic-profile=bad_value` -> esperado `400`.
2. **Prueba B - Trafico normal**  
Request normal a `health` -> esperado `200`.
3. **Prueba C - Snapshot operacional**  
`GET /api/v1/internal/metrics?profile=operational` -> esperado `200` y payload coherente.

### 3.2 Verificacion de integridad de senal
1. Consultar `GET /api/v1/internal/alerts/operational?profile=operational`.
2. Revisar `profile_header_valid_rate` y confirmar umbral `>= 0.999`.
3. Confirmar ausencia de desviaciones por mezcla `validation` en lectura operacional.

### 3.3 Observacion corta post-activacion
Ventana recomendada: 10-15 minutos con monitoreo de:
1. `error_rate`
2. `5xx_count`
3. `profile_header_valid_rate`

### 3.4 Evidencia minima postcheck
1. Respuesta de prueba A (`400`).
2. Respuesta de prueba B (`200`).
3. JSON de prueba C (`metrics operational`).
4. Estado de alertas operacionales.
5. Timestamp de cierre de ventana y decision final.

---

## Checklist de evidencia (Go/No-Go)

## Gate 1 - Precheck
1. [ ] Acceso administrativo a borde confirmado.
2. [ ] Respaldos realizados.
3. [ ] Variables de entorno objetivo confirmadas.

## Gate 2 - Cutover
1. [ ] Regla de inyeccion/rechazo aplicada.
2. [ ] Validacion tecnica de config en verde.
3. [ ] API post-cutover con salud `200`.

## Gate 3 - Postcheck funcional
1. [ ] Prueba A (`400`) aprobada.
2. [ ] Prueba B (`200`) aprobada.
3. [ ] Prueba C (`metrics?profile=operational`) aprobada.

## Gate 4 - Integridad operacional
1. [ ] `profile_header_valid_rate >= 0.999`.
2. [ ] Sin evidencia de contaminacion de señal operacional.
3. [ ] Alertas operacionales en estado esperado.

## Decision final
1. [ ] **GO**: cierre de `PND-M5-F2-PROD` en acta.
2. [ ] **NO-GO**: rollback + registro de incidente + nueva ventana de cambio.

---

## Registro de ejecucion (plantilla)
1. Fecha/hora inicio:
2. Responsable tecnico:
3. Plataforma borde:
4. Version regla aplicada:
5. Resultado Prueba A:
6. Resultado Prueba B:
7. Resultado Prueba C:
8. Estado final alertas:
9. Decision (GO/NO-GO):
10. Fecha/hora cierre:
