# ACTA DE CIERRE - BLOQUE C

## Fecha
2026-04-13

## Alcance cerrado

Bloque C (Auth + RBAC + Auditoría mínima) queda cerrado en MVP técnico.

### Implementado

1. Autenticación
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

2. RBAC backend autoritativo
- Middleware `authenticate` (JWT bearer + contexto auth)
- Middleware `authorize(permission)` con validación de permisos en BD

3. C.2 Alcance por policy (`self/module/all`)
- Implementado en `scope.policy.ts`
- Resolución por rol + permiso (overrides críticos)
- Evaluación de acceso por expediente:
  - `self`: vínculo directo usuario-expediente
  - `module`: asignación directa a expediente/etapa
  - `all`: acceso transversal

4. Auditoría mínima
- `auditService.log` y `auditService.safeLog`
- Acciones críticas con auditoría obligatoria en rutas piloto:
  - `expedientes.change_state_attempted`
  - `workflow.reopen_stage`

5. Pruebas E2E mínimas
- `auth-rbac.e2e.test.ts` con validaciones:
  - 401 sin token
  - 403 sin permiso
  - 403 por denegación de scope
  - 200 con permiso/scope válido
  - 501 endpoint piloto sin mutación real
  - 500 si falla auditoría crítica

## Resultado

Bloque C validado para MVP técnico y listo para iteración funcional posterior (mutaciones reales de negocio y ampliación de policies por módulo).
