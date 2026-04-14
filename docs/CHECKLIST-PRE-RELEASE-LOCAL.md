# CHECKLIST PRE-RELEASE LOCAL

## Objetivo

Validar en forma rapida y repetible que la plataforma local esta en estado apto antes de demo, QA o push de cambios.

## Alcance

- API (`@pac/api`)
- Infra local (Postgres + Redis)
- Contrato base de endpoints (`health` y endpoint protegido)
- Regresion automatizada minima (unit + e2e)

## Prerrequisitos

- Docker Desktop operativo
- Dependencias instaladas (`pnpm install`)
- Variables de entorno disponibles (`.env` o autoconfiguracion de smoke para API temporal)

## Secuencia de ejecucion

### 1) Infraestructura local

Comando:

```bash
pnpm docker:up
```

Criterio PASS:
- Contenedores `pac-postgres` y `pac-redis` en ejecucion y healthy.

Criterio FAIL:
- Cualquier contenedor no inicia o queda unhealthy.

---

### 2) Smoke-test de plataforma

Comando:

```bash
pnpm smoke:local
```

Criterio PASS:
- Health API responde `200` con `service=api`, `status=ok`.
- Endpoint protegido responde `401` con `code=UNAUTHENTICATED`.
- Script finaliza con `Smoke test local completado: PASS`.

Criterio FAIL:
- API no disponible.
- Contrato de health o seguridad no cumple.
- Script termina con `ELIFECYCLE`/exit code != 0.

---

### 3) Typecheck API

Comando:

```bash
pnpm --filter @pac/api typecheck
```

Criterio PASS:
- Sin errores TypeScript.

Criterio FAIL:
- Cualquier error de tipos.

---

### 4) Unit tests API

Comando:

```bash
pnpm --filter @pac/api test:unit
```

Criterio PASS:
- Suite en verde.

Criterio FAIL:
- Fallo en cualquier test unitario.

---

### 5) E2E tests API

Comando:

```bash
pnpm --filter @pac/api test:e2e
```

Criterio PASS:
- Suite en verde (actual: `17/17`).

Criterio FAIL:
- Fallo en cualquier prueba de integracion.

## Cierre operativo

Se considera **pre-release local aprobado** solo si los 5 pasos anteriores estan en PASS.

## Comando de referencia (ejecucion completa)

```bash
pnpm docker:up
pnpm smoke:local
pnpm --filter @pac/api typecheck
pnpm --filter @pac/api test:unit
pnpm --filter @pac/api test:e2e
```

## Automatizacion one-shot

Comando:

```bash
pnpm preflight:local
```

Comportamiento:
- Ejecuta la secuencia completa del checklist en orden.
- Falla en el primer paso que no cumple (fail-fast).
- Finaliza con `Preflight local completado: PASS` si todo valida.
