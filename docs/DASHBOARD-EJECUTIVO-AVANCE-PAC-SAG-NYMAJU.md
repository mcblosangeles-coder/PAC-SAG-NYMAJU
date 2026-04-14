# DASHBOARD EJECUTIVO - AVANCE PAC-SAG-NYMAJU

## Fecha de corte
2026-04-14

## Resumen ejecutivo

| Indicador | Valor |
|---|---:|
| Macrofases completadas | 2 / 3 (M1, M2) |
| Macrofase en curso | 1 / 3 (M3) |
| Bloques cerrados en M3 | A, B, C, D, E1 |
| Estado general del programa | Avance alto |

## Tabla de estado (avance / ejecucion / pendiente)

| ID | Frente / Entregable | Estado | Evidencia principal | Proximo hito |
|---|---|---|---|---|
| M1 | Plataforma base (monorepo, docker, prisma base, auth/rbac inicial) | Avance (cerrado) | Actas de MacroFase 1 y Bloque C | Sin accion pendiente |
| M2 | Contratos API + endurecimiento técnico + validaciones | Avance (cerrado) | Acta cierre MacroFase 2 | Sin accion pendiente |
| M3-A | Backlog funcional + consulta operativa + workflow + historial | Avance (cerrado) | Acta MacroFase 3 (A1-A5) | Sin accion pendiente |
| M3-B | Sesiones persistentes refresh + replay + auditoria auth | Avance (cerrado) | Diseno B1 + implementacion B2/B3 | Monitoreo operativo |
| M3-C | CI quality gates minimo | Avance (cerrado) | Workflow CI activo | Endurecer reglas de rama (opcional) |
| M3-D | Logging operativo (politica, catalogo, retencion/SIEM) | Avance (cerrado) | Documentos M3-D2 y validacion formal | Integracion SIEM real (pendiente futuro) |
| M3-E1 | Instrumentacion operativa minima + endpoint metricas + runbook + checklist | Avance (cerrado) | M3-E1 metricas, runbook, checklist y acta | Calibrar umbrales con trafico real |
| M3-E2 | Persistencia historica de metricas (TSDB/collector) | Pendiente | No iniciado | Definir stack y arquitectura |
| M3-E3 | Alertamiento externo automatizado (canal operativo) | Pendiente | No iniciado | Definir reglas y SLA |
| M3-E4 | Dashboard operacional productivo (latencia/errores/seguridad) | Pendiente | No iniciado | Diseñar vistas y KPIs finales |

## Puntos pendientes priorizados

1. M3-E2: persistir metricas fuera de memoria (historico y tendencia).
2. M3-E3: activar alertas automáticas sobre umbrales M3-E1.
3. M3-E4: tablero operacional para toma de decisiones en tiempo real.

## Riesgos residuales (vigentes)

| Riesgo | Impacto | Mitigacion recomendada |
|---|---|---|
| Metricas en memoria se reinician al reiniciar proceso | Medio | Implementar collector/TSDB (M3-E2) |
| Sin SIEM conectado todavia | Medio | Integrar salida estructurada con collector (M3-E2/M3-E3) |
| Umbrales iniciales pueden no reflejar carga real | Medio | Calibrar tras ventana de observacion controlada |
