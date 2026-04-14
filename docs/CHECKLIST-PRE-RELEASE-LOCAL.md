# CHECKLIST PRE-RELEASE LOCAL

## Objetivo

Validar en forma rapida y repetible que la plataforma local esta en estado apto antes de demo, QA o push de cambios.

## Alcance

- API (`@pac/api`)
- Infra local (Postgres + Redis)
- Contrato base de endpoints (`health` y endpoint protegido)
- Regresion automatizada minima (unit + e2e)
- Verificacion operativa de observabilidad (`/internal/metrics`)
- Verificacion operacional de alertas automaticas (`/internal/alerts/operational`)

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
- Suite en verde (actual: `38/38`).

Criterio FAIL:
- Fallo en cualquier prueba de integracion.

---

### 6) Verificacion de metricas operativas (M3-E1/M3-E2)

Comando (sin token):

```bash
curl -s http://localhost:4000/api/v1/internal/metrics
```

Comando (si `METRICS_TOKEN` esta configurado):

```bash
curl -s -H "x-metrics-token: <METRICS_TOKEN>" http://localhost:4000/api/v1/internal/metrics
```

Criterio PASS:
- Endpoint responde `200`.
- Existen las 6 metricas:
  - `error_rate`
  - `p95_latency`
  - `5xx_count`
  - `auth_refresh_failed_rate`
  - `audit_log_failed_count`
  - `workflow_422_rate`
- `summary.failingMetrics` sin valores criticos bloqueantes para release.

Criterio FAIL:
- Endpoint no responde `200`.
- Faltan metricas del contrato.
- `summary.failingMetrics` evidencia degradacion no aceptada.

---

### 7) Verificacion de alertas operativas automaticas (M3-E3)

Comando (estado):

```bash
curl -s -H "x-metrics-token: <METRICS_TOKEN>" http://localhost:4000/api/v1/internal/alerts/operational
```

Comando (evaluacion manual):

```bash
curl -s -X POST -H "x-metrics-token: <METRICS_TOKEN>" http://localhost:4000/api/v1/internal/alerts/operational/evaluate
```

Criterio PASS:
- ambos endpoints responden `200`,
- payload incluye `rules` y `lastEvaluationStatus`,
- existen reglas `error_rate_24h`, `p95_latency_24h`, `count_5xx_24h`.

Criterio FAIL:
- endpoint retorna error o no responde,
- faltan reglas esperadas,
- evaluacion no retorna estado.

---

### 8) Verificacion de acciones operativas de alertas (M3-E5)

Comando (acknowledge):

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-metrics-token: <METRICS_TOKEN>" \
  -d '{"comment":"Acknowledge manual M3-E5","operator":"ops:pre-release"}' \
  http://localhost:4000/api/v1/internal/alerts/operational/error_rate_24h/acknowledge
```

Comando (silence):

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-metrics-token: <METRICS_TOKEN>" \
  -d '{"reason":"Ventana de mantenimiento","silencedUntil":"<ISO_UTC_FUTURO>","operator":"ops:pre-release"}' \
  http://localhost:4000/api/v1/internal/alerts/operational/error_rate_24h/silence
```

Comando (unsilence):

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-metrics-token: <METRICS_TOKEN>" \
  -d '{"reason":"Fin de mantenimiento","operator":"ops:pre-release"}' \
  http://localhost:4000/api/v1/internal/alerts/operational/error_rate_24h/unsilence
```

Comandos (historial):

```bash
curl -s -H "x-metrics-token: <METRICS_TOKEN>" "http://localhost:4000/api/v1/internal/alerts/operational/actions?ruleId=error_rate_24h&page=1&pageSize=20"
curl -s -H "x-metrics-token: <METRICS_TOKEN>" "http://localhost:4000/api/v1/internal/alerts/operational/events?ruleId=error_rate_24h&page=1&pageSize=20"
```

Criterio PASS:
- endpoints `acknowledge/silence/unsilence` responden `200`,
- historial de acciones contiene `ACKNOWLEDGE`, `SILENCE`, `UNSILENCE`,
- historial de eventos contiene `ACKNOWLEDGED`, `SILENCED`, `UNSILENCED`.

Criterio FAIL:
- cualquiera de los endpoints responde != `200`,
- no se registran acciones/eventos esperados en historial.

## Cierre operativo

Se considera **pre-release local aprobado** solo si los 8 pasos anteriores estan en PASS.

## Comando de referencia (ejecucion completa)

```bash
pnpm docker:up
pnpm smoke:local
pnpm --filter @pac/api typecheck
pnpm --filter @pac/api test:unit
pnpm --filter @pac/api test:e2e
curl -s http://localhost:4000/api/v1/internal/metrics
curl -s -X POST -H "x-metrics-token: <METRICS_TOKEN>" http://localhost:4000/api/v1/internal/alerts/operational/evaluate
curl -s -X POST -H "Content-Type: application/json" -H "x-metrics-token: <METRICS_TOKEN>" -d '{"comment":"Acknowledge manual M3-E5","operator":"ops:pre-release"}' http://localhost:4000/api/v1/internal/alerts/operational/error_rate_24h/acknowledge
curl -s -H "x-metrics-token: <METRICS_TOKEN>" "http://localhost:4000/api/v1/internal/alerts/operational/actions?ruleId=error_rate_24h&page=1&pageSize=20"
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
