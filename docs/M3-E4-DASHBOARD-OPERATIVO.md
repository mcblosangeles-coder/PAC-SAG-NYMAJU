# M3-E4 - Dashboard operativo (alertas + tendencias 24h/7d)

## Objetivo

Exponer en la web un panel operativo único para:

1. estado de alertas automáticas M3-E3,
2. estado de salud actual de métricas,
3. tendencias históricas M3-E2 para 24h y 7d.

## Avance detallado

### Avance 1 - Integración API interna en frontend

Se conecta `apps/web` a endpoints internos:

- `GET /api/v1/internal/metrics`
- `GET /api/v1/internal/metrics/history?window=24h`
- `GET /api/v1/internal/metrics/history?window=7d`
- `GET /api/v1/internal/alerts/operational`

Soporta `x-metrics-token` desde UI y persistencia local (`localStorage`).

### Avance 2 - Estructura del dashboard operativo

Se implementan bloques:

1. salud operacional (`isHealthy`, failing metrics),
2. estado del evaluador (`lastEvaluationStatus`, mensaje),
3. reglas activas y severidad,
4. tabla snapshot de métricas actuales,
5. selector de ventana (24h/7d),
6. visualización de tendencias.

### Avance 3 - Tendencias 24h/7d

Se agregan charts SVG livianos (sin dependencia externa) para:

- `error_rate`,
- `p95_latency`,
- `5xx_count`.

### Avance 4 - Robustez operativa UX

1. carga inicial automática,
2. recarga manual (`Actualizar`),
3. manejo de errores de integración API,
4. diseño responsive para desktop/mobile.

## Criterio de salida M3-E4

1. dashboard web consume datos reales de M3-E2/M3-E3,
2. se visualizan alertas + snapshot + tendencias 24h/7d,
3. opera con y sin token (según configuración backend),
4. compilación/typecheck web en verde.

## Riesgos residuales

1. no existe autenticación dedicada de frontend para panel interno (usa token manual),
2. chart SVG es MVP (sin zoom/anotaciones),
3. falta integración de acciones correctivas desde UI (solo observación).
