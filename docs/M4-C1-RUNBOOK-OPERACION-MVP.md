# M4-C1 - Runbook operativo MVP (F1-F5)

## Objetivo

Definir un procedimiento operativo minimo y reproducible para soporte funcional del MVP en los flujos criticos F1-F5.

## Alcance

Este runbook aplica a:

1. F1 acceso seguro (login/me/refresh).
2. F2 consulta operativa de expediente.
3. F3 workflow + historial.
4. F4 cambio de estado.
5. F5 reapertura de etapa.

## Checklist de precondiciones operativas

1. API disponible en `http://localhost:4000/api/v1/health`.
2. Web disponible en `http://localhost:5173` o `5174`.
3. Token valido (`accessToken`) obtenido por `POST /auth/login`.
4. ID de expediente valido disponible en bandeja.

## Flujos de diagnostico rapido por sintoma

### 1) Error `UNAUTHENTICATED`

Diagnostico:
1. Token ausente, invalido o expirado.

Accion:
1. regenerar token por `POST /auth/login`,
2. pegar token nuevo en UI y recargar bandeja.

### 2) Error `FORBIDDEN`

Diagnostico:
1. rol sin permiso para endpoint/accion.

Accion:
1. validar rol y permisos (`expedientes.change_state`, `workflow.reopen_stage`, `workflow.read`),
2. repetir login para refrescar claims de token si hubo cambios de rol.

### 3) Error `NOT_FOUND`

Diagnostico:
1. expediente no existe o etapa no existe en expediente.

Accion:
1. confirmar ID de expediente en DB,
2. para `reopen-stage`, validar etapa disponible en tabla workflow antes de ejecutar.

### 4) Error `CONFLICT` (409)

Diagnostico:
1. transicion/reapertura invalida por reglas de workflow.

Accion:
1. revisar estado actual del expediente/etapa,
2. en `reopen-stage`, usar solo etapas con estado `CERRADA|OBSERVADA|BLOQUEADA|VENCIDA|RECHAZADA`,
3. ejecutar secuencia valida segun reglas del dominio.

### 5) Error `UNPROCESSABLE_ENTITY` (422)

Diagnostico:
1. precondiciones no cumplidas (bloqueos activos alertas/NC).

Accion:
1. consultar bloqueos en resumen/workflow,
2. resolver bloqueos,
3. reintentar accion.

## Procedimiento de validacion funcional minima (post deploy)

1. Login exitoso (F1).
2. Carga de bandeja con al menos 1 expediente (F2).
3. Apertura de detalle con workflow + historial (F3).
4. Ejecutar `change-state` y validar respuesta esperada (`200`, `409` o `422`) (F4).
5. Ejecutar `reopen-stage` y validar respuesta esperada (`200`, `404` o `409`) (F5).

## Evidencia requerida para cierre de incidente funcional

1. endpoint invocado,
2. payload enviado (sin secretos),
3. estado HTTP,
4. `code/message` devuelto,
5. accion correctiva aplicada,
6. resultado final.

## Pendiente no bloqueante (estado final)

ID: `PNB-M4-B1-F5-200`

Estado: CERRADO

Contexto de cierre:
1. Se ejecuto seed de dataset M4.
2. Se corrio prueba dirigida de F5 sobre `PAC-VERIF-001`.
3. Se obtuvo respuesta `200` con transicion `CERRADA -> REABIERTA`.

Evidencia:
1. Endpoint: `POST /api/v1/expedientes/35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431/reopen-stage`.
2. Payload: `etapa=REVISION_TECNICA`, `motivo=Cierre pendiente PNB-M4-B1-F5-200`.
3. Respuesta: `200`, `estadoAnterior=CERRADA`, `estadoNuevo=REABIERTA`.

## Escalamiento

Escalar a equipo backend cuando:

1. hay `500 INTERNAL_ERROR` repetido,
2. hay desviacion entre contrato y comportamiento real,
3. falla flujo critico con precondiciones correctas.

## Relacion documental

1. Contrato funcional UI/API:
- `docs/M4-A1-02-CONTRATO-API-FLUJOS-MVP.md`

2. Matriz E2E:
- `docs/M4-D1-01-MATRIZ-TRAZABILIDAD-E2E-MVP.md`

3. UX de errores:
- `docs/M4-B2-ESTANDARIZACION-UX-ERRORES.md`

4. Acta de seguimiento:
- `docs/ACTA-AVANCE-MACROFASE-4.md`
