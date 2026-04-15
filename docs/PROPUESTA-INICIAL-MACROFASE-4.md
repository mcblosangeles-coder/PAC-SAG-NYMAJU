# PROPUESTA INICIAL MACROFASE 4 (M4)

## 1) Diagnóstico base de entrada

La MacroFase 3 deja una base técnica endurecida y verificable:

- Seguridad operativa: auth+RBAC, refresh tokens persistentes, rate limiting y hardening de proxy.
- Observabilidad: logging estructurado, métricas internas, histórico, alertas automáticas y acciones operativas.
- Calidad: pipeline CI con gates (`lint`, `typecheck`, `tests`, `build`).

Conclusión: el sistema está listo para pasar de “plataforma técnica robusta” a “producto funcional de negocio”.

## 2) Objetivo de MacroFase 4

Convertir la base actual en una versión operable de producto (MVP funcional), cerrando brechas de:

1. experiencia de usuario en flujos críticos;
2. consistencia de reglas de negocio de punta a punta;
3. preparación de despliegue real y operación controlada;
4. evidencia funcional para salida de MVP.

## 3) Alcance propuesto (M4)

### M4-A: Flujo funcional core (expedientes)
- Consolidar flujo end-to-end de expediente:
  - creación/consulta/actualización básica;
  - transición de estados con precondiciones;
  - historial trazable y consistente en UI/API.
- Normalizar contratos de respuesta para UI (`code`, `message`, `data`) donde aplique.
- Cerrar reglas pendientes de workflow para casos límite (errores de negocio y consistencia).

### M4-B: UX operativa y control de trabajo
- Pantallas operativas mínimas para rol analista/supervisor:
  - bandeja/listado con filtros y búsqueda;
  - detalle de expediente con estado actual, historial y acciones permitidas;
  - vista de errores de validación de negocio con mensajes accionables.
- Acciones con feedback claro en UI (éxito, conflicto `409`, precondición `422`, no autorizado `401/403`).

### M4-C: Documentación contractual y handoff
- Contrato funcional actualizado de endpoints usados por UI.
- Matriz de permisos operativa actualizada por caso de uso.
- Runbook de operación MVP (incidencias comunes y recuperación).

### M4-D: Calidad de salida MVP
- E2E funcionales de negocio prioritarios (no solo seguridad/plataforma).
- Checklist de salida MVP con evidencia reproducible.
- Acta de cierre M4 con riesgos residuales y decisión go/no-go.

## 4) Fuera de alcance (para evitar dispersión)

- Integraciones enterprise complejas no críticas para MVP.
- Multi-tenant completo.
- Analítica avanzada fuera de métricas operativas mínimas.
- Rediseño visual mayor no asociado a flujos críticos.

## 5) Secuencia de ejecución recomendada

1. **M4-A1**: Definición final de casos de uso MVP (3 a 5 flujos críticos).
2. **M4-A2**: Ajustes backend de workflow/expedientes para cubrir esos flujos.
3. **M4-B1**: Implementación UI de bandeja + detalle + acciones.
4. **M4-B2**: Integración UI/API y manejo formal de errores de negocio.
5. **M4-D1**: Pruebas E2E funcionales y evidencia.
6. **M4-C1**: Cierre documental (contratos, matriz permisos, runbook).
7. **M4-D2**: Acta final de salida MVP.

## 6) Priorización inicial (P1/P2/P3)

- **P1**
  - Flujo expediente end-to-end operativo.
  - Reglas de transición y precondiciones consistentes (API + UI).
  - E2E de negocio de punta a punta.
- **P2**
  - Mejoras UX de productividad (filtros, estados visuales, errores guiados).
  - Optimización de tiempos de respuesta en consultas frecuentes.
- **P3**
  - Mejoras no bloqueantes de refinamiento visual y reportes extendidos.

## 7) Criterios de salida MacroFase 4

Se considera M4 cerrada si se cumplen todos:

1. Flujos críticos MVP ejecutables en entorno local/staging sin intervención manual técnica.
2. Contratos UI/API estables y documentados.
3. Permisos RBAC validados para acciones críticas.
4. Suite E2E funcional de negocio en verde.
5. CI remoto en verde sobre commit de cierre M4.
6. Acta final con riesgos residuales explícitos y plan de mitigación.

## 8) Riesgos principales de M4

- Deriva de alcance hacia “feature creep”.
- Inconsistencia entre reglas backend y comportamiento UI.
- Falta de datos de prueba representativos para validar casos reales.
- Deuda de UX operativa que impacte adopción de usuarios.

Mitigación:
- Trabajo por bloques cerrados con criterios de salida por bloque.
- Validación funcional semanal con evidencia en acta.
- Priorización estricta de flujos P1 antes de P2/P3.

## 9) Plan de arranque inmediato (primer sprint M4)

### Sprint M4-S1 (recomendado)
- **M4-A1-01**: Definir listado final de 5 flujos críticos con actor, trigger, resultado esperado.
- **M4-A1-02**: Alinear contrato API de esos flujos (request/response + errores esperados).
- **M4-A2-01**: Ajustar backend para cumplir el contrato (workflow y expedientes).
- **M4-D1-01**: Crear 3 pruebas E2E de negocio iniciales (happy path + 2 fallos de negocio).

### Evidencia mínima de cierre de sprint
- Documento de casos de uso MVP aprobado.
- Endpoints funcionales validados.
- E2E iniciales en verde.
- Registro en acta de MacroFase 4.

