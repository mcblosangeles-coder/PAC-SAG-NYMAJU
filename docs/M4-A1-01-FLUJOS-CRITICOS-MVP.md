# M4-A1-01 - Flujos Criticos MVP (cierre propuesto)

## Objetivo

Definir el set minimo de 5 flujos de negocio que habilitan operacion real del MVP PAC-SAG-NYMAJU sobre la base tecnica consolidada en M3.

## Alcance de seleccion

- Solo flujos con impacto directo en operacion diaria.
- Cada flujo debe tener soporte en API existente.
- Priorizacion orientada a valor operativo y control de riesgo.

## Flujos criticos finales (5)

### F1 - Acceso seguro y contexto de usuario

**Actor principal:** Analista / Supervisor  
**Endpoints base:**  
- `POST /api/v1/auth/login`  
- `GET /api/v1/auth/me`  
- `POST /api/v1/auth/refresh`  

**Resultado esperado:** el usuario accede, obtiene su contexto de permisos/roles y puede mantener sesion activa de forma segura.

**Por que es critico:** sin este flujo no existe operacion autenticada ni control de acceso.

---

### F2 - Consulta operativa del expediente

**Actor principal:** Analista / Supervisor  
**Endpoint base:**  
- `GET /api/v1/expedientes/:id`

**Resultado esperado:** obtener vista operativa del expediente para diagnostico y toma de decisiones.

**Por que es critico:** es la lectura principal del estado actual del caso.

---

### F3 - Lectura de workflow e historial de estados

**Actor principal:** Analista / Supervisor  
**Endpoints base:**  
- `GET /api/v1/expedientes/:id/workflow`  
- `GET /api/v1/expedientes/:id/history`

**Resultado esperado:** visualizar estado actual del workflow y trazabilidad historica del expediente.

**Por que es critico:** habilita control operativo, auditoria funcional y seguimiento de avance.

---

### F4 - Cambio de estado del expediente (accion critica)

**Actor principal:** Supervisor (o rol con permiso)  
**Endpoint base:**  
- `POST /api/v1/expedientes/:id/change-state`

**Resultado esperado:** transicion de estado valida con control de reglas de negocio (`409` / `422` cuando corresponde) y registro de auditoria.

**Por que es critico:** es la accion de negocio mas sensible del ciclo de vida.

---

### F5 - Reapertura de etapa (accion critica correctiva)

**Actor principal:** Supervisor (o rol con permiso)  
**Endpoint base:**  
- `POST /api/v1/expedientes/:id/reopen-stage`

**Resultado esperado:** reapertura controlada de etapa con motivo obligatorio, validacion de reglas y trazabilidad.

**Por que es critico:** permite correccion operativa sin romper gobernanza del workflow.

## Prioridad operativa

- **P1:** F1, F2, F3, F4, F5  
- No se define P2/P3 en esta fase de cierre porque los 5 flujos son bloqueantes para MVP funcional.

## Criterio de validacion M4-A1-01

Se considera validado cuando:

1. Los 5 flujos son aceptados como baseline funcional de MVP.
2. Cada flujo tiene endpoint(s) y actor responsable definidos.
3. Se aprueba avanzar a contrato API formal (M4-A1-02) sin cambios de alcance.

## Estado de validacion

- M4-A1-01: APROBADO COMO BASELINE OFICIAL P1.
- Alcance bloqueado para ejecucion M4 sobre F1-F5 salvo aprobacion explicita de cambio.
