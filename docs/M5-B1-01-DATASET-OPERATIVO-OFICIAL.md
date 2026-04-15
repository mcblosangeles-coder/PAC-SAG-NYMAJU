# M5-B1-01 - Dataset operativo oficial (QA/UAT)

## Objetivo

Definir el dataset oficial y reproducible para validacion operativa de los flujos F1-F5, con trazabilidad de casos y resultados esperados.

## Fuente de verdad del dataset

1. Seed oficial:
- `prisma/seed/seed.ts`

2. Expedientes de validacion M4/M5:
- `PAC-VERIF-001`
- `PAC-VERIF-002`
- `PAC-VERIF-003`

## Credenciales operativas base (QA/UAT)

1. Usuario:
- `admin@pac.local`

2. Password:
- `ChangeMe_123!`

3. Rol por defecto:
- `admin_sistema`

Nota:
- para validar acciones criticas F4/F5 en UI, se recomienda incluir rol `director_pac` o rol con permisos equivalentes sobre `expedientes.change_state` y `workflow.reopen_stage`.

## Matriz oficial de casos del dataset

| Caso | Flujo(s) | Expediente ID | Codigo interno | Precondiciones del caso | Expected outcomes |
|---|---|---|---|---|---|
| DS-01 | F2, F3, F5 | `35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431` | `PAC-VERIF-001` | Estado global `CONTROL`; etapa `REVISION_TECNICA` en `CERRADA`; etapa `CONTROL_FINAL` en `EN_PROGRESO`; sin bloqueo duro obligatorio para reapertura. | `GET /expedientes/:id` -> `200`; `GET /workflow` -> incluye `REVISION_TECNICA`; `POST /reopen-stage` con `REVISION_TECNICA` -> `200` (`CERRADA -> REABIERTA`). |
| DS-02 | F2, F3, F4 | `b84fb315-bf65-40d4-86ff-6e4a52149965` | `PAC-VERIF-002` | Estado global `CONTROL`; etapa `REVISION_TECNICA` en `EN_PROGRESO`; alerta activa bloqueante (`blocking=true`). | `GET /expedientes/:id` -> `200`; `POST /change-state` a `APROBADO` -> `422 UNPROCESSABLE_ENTITY` por bloqueo activo. |
| DS-03 | F2, F3 | `0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8` | `PAC-VERIF-003` | Estado global `DOCUMENTAL`; etapa `CHECKLIST` en `EN_PROGRESO`; caso base sin accion critica obligatoria. | `GET /expedientes/:id` -> `200`; `GET /workflow` y `GET /history` -> `200` para validacion de consulta operativa base. |

## Casos de control complementario (sin dataset fijo)

| Caso | Flujo | Tipo | Precondicion | Expected outcomes |
|---|---|---|---|---|
| DS-04 | F1 | Token invalido/expirado | Access token alterado o vencido | `401 UNAUTHENTICATED` en endpoints protegidos. |
| DS-05 | F4 | Transicion invalida | Intentar estado no permitido por workflow | `409 CONFLICT`. |
| DS-06 | F5 | Etapa no existente | Enviar `etapa` no presente en expediente | `404 NOT_FOUND`. |

## Precondiciones tecnicas minimas para ejecutar dataset

1. Servicios locales activos:
- Postgres
- Redis
- API (`:4000`)
- Web (`:5173` o `:5174`)

2. Variables criticas API definidas:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `API_PREFIX`
- `CORS_ALLOWED_ORIGINS` (incluyendo puerto real de Vite)

3. Base sincronizada:
- migraciones aplicadas
- seed ejecutado

## Procedimiento de refresh del dataset (QA/UAT)

### Refresh estandar (recomendado)

1. `pnpm.cmd db:seed`

Resultado esperado:
- datos base + dataset operativo de validacion restaurados en estado conocido.

### Refresh completo (cuando hay deriva de esquema/datos)

1. `pnpm.cmd db:reset`
2. `pnpm.cmd db:seed`

Resultado esperado:
- esquema limpio y dataset operativo recreado desde cero.

## Criterios de aceptacion del refresh

Se considera refresh valido cuando:

1. login de `admin@pac.local` responde `200`;
2. los 3 IDs oficiales (`DS-01/02/03`) responden `200` en resumen F2;
3. `DS-01` permite evidencia F5 positiva (`reopen-stage` `200`);
4. `DS-02` mantiene evidencia F4 de precondicion bloqueante (`422`).

## Evidencia minima a registrar por ciclo QA/UAT

1. fecha/hora del refresh;
2. comando(s) ejecutados;
3. resultado de login;
4. resultado de DS-01 F5 (`200`);
5. resultado de DS-02 F4 (`422`);
6. observaciones/desviaciones.

## Versionado del dataset operativo

- Version actual: `v1.0-M5`
- Fecha: `2026-04-15`
- Estado: `OFICIAL QA/UAT`

## Criterio de cierre M5-B1-01

1. casos oficiales definidos con ID y objetivo;
2. expected outcomes por caso documentados;
3. refresh y criterios de aceptacion establecidos;
4. documento adoptado como referencia unica para QA/UAT.

Estado: **IMPLEMENTADO**.
