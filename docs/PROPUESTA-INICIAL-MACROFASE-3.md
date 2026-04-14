# PROPUESTA INICIAL - MACROFASE 3

## Fecha
2026-04-13

## 1) Objetivos de MacroFase 3

1. Implementar verticales funcionales de negocio sobre la base tecnica validada en MacroFase 2.
2. Consolidar integridad de workflow (mutaciones reales + reglas de dominio + auditoria obligatoria).
3. Preparar operacion continua con estandar de calidad repetible (preflight + pruebas + criterio de release).
4. Reducir riesgos residuales principales: sesion JWT, automatizacion CI y observabilidad minima.

## 2) Alcance propuesto

### En alcance

1. Workflow de expedientes end-to-end (lectura + cambios de estado + reaperturas + trazabilidad).
2. Endpoints funcionales prioritarios para operacion PAC:
- consulta operativa de expediente,
- transiciones de estado de negocio,
- reapertura controlada de etapas,
- historial y auditoria consultable.
3. Hardening de seguridad MVP:
- estrategia de refresh token (rotacion/revocacion),
- cierre de sesion efectivo.
4. Calidad y operacion:
- pipeline CI minimo con puertas de calidad,
- observabilidad base (logs estructurados + checks operativos).

### Fuera de alcance (esta propuesta inicial)

1. Despliegue productivo multi-entorno completo.
2. Escalamiento horizontal avanzado y optimizacion de costo.
3. Analitica avanzada y reporting ejecutivo de alto volumen.

## 3) Secuencia recomendada (orden de ejecucion)

1. **Bloque A - Dominio funcional de expedientes**
- cerrar vertical funcional de workflow con reglas completas y respuestas consistentes.
2. **Bloque B - Seguridad de sesion**
- pasar de logout stateless a control de refresh tokens.
3. **Bloque C - CI + puertas de calidad**
- automatizar verificacion de pre-release por PR/merge.
4. **Bloque D - Observabilidad minima**
- estandarizar logging y controles de estado operativos.
5. **Bloque E - Cierre y handoff**
- validar criterios de salida de MacroFase 3 y preparar acta de cierre.

## 4) Tabla de actividades a ejecutar

| ID | Bloque | Actividad | Entregable | Dependencias | Criterio de validacion |
|---|---|---|---|---|---|
| M3-A1 | A | Definir backlog funcional priorizado de expediente (casos de uso y contratos API) | `docs/BACKLOG-M3-FUNCIONAL.md` | Actas MF2 | Backlog aprobado y ordenado por prioridad |
| M3-A2 | A | Implementar servicio de consulta de expediente con vista operativa consolidada | Endpoint + servicio + tests | M3-A1 | `typecheck` OK + tests verdes |
| M3-A3 | A | Completar reglas de workflow faltantes (precondiciones, transiciones, errores de dominio) | Reglas en servicios + e2e | M3-A2 | Casos validos/invalidos cubiertos en e2e |
| M3-A4 | A | Exponer historial/auditoria consultable por expediente | Endpoint `historial` + pruebas | M3-A3 | Respuesta consistente + permisos aplicados |
| M3-B1 | B | Diseñar esquema de refresh tokens (persistencia + ciclo de vida) | ADR corta + cambios Prisma | MF2 cierre | Diseño aprobado |
| M3-B2 | B | Implementar rotacion y revocacion de refresh token | Auth service + migracion + tests | M3-B1 | Logout invalida sesion y refresh anterior |
| M3-B3 | B | Endurecer `/auth/refresh` y `/auth/logout` con auditoria de seguridad | Rutas + auditoria + e2e | M3-B2 | Casos de abuso cubiertos |
| M3-C1 | C | Crear pipeline CI minimo (typecheck, unit, e2e, preflight) | Workflow CI | M3-A4, M3-B3 | Pipeline ejecuta en PR y bloquea fallos |
| M3-C2 | C | Publicar politica de merge (quality gates obligatorios) | `docs/POLITICA-MERGE-M3.md` | M3-C1 | Politica aprobada y aplicada |
| M3-D1 | D | Estandarizar logs estructurados en API | Logger base + adaptacion módulos | M3-C1 | Logs con campos minimos uniformes |
| M3-D2 | D | Definir y aplicar chequeos operativos base | `health` extendido + smoke | M3-D1 | Smoke/preflight cubre criterios operativos |
| M3-E1 | E | Ejecutar cierre técnico MacroFase 3 | Acta de avance/cierre MF3 | Todos los anteriores | Criterios de salida cumplidos |

## 5) Listado operativo corto (ejecucion inmediata)

1. Crear `BACKLOG-M3-FUNCIONAL.md` con historias y prioridades (A1).
2. Definir contrato de endpoint de consulta operativa de expediente (A2).
3. Implementar A2 con pruebas unit/e2e.
4. Implementar reglas faltantes de workflow y cobertura de errores de dominio (A3).
5. Preparar propuesta de esquema refresh-token y migracion (B1).

## 6) Criterio de salida de MacroFase 3 (propuesto)

1. Funcionalidad de expediente prioritaria implementada y validada.
2. Seguridad de sesion JWT con refresh token controlado (rotacion/revocacion).
3. Pipeline CI activo con quality gates.
4. Observabilidad minima y checklist operativo actualizado.
5. Acta de cierre MF3 emitida con riesgos residuales y handoff.
