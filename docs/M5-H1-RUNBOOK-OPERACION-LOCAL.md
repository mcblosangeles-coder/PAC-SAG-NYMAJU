# M5-H1 - Runbook Unico de Operacion Local

## Objetivo
Estandarizar la operacion diaria local de la plataforma para reducir friccion, errores manuales y variaciones entre sesiones.

## Comandos oficiales (baseline)

1. Levantar infraestructura local:
```bash
pnpm local:up
```

2. Ver estado de contenedores base:
```bash
pnpm local:status
```

3. Validacion de humo (infra + API + endpoint protegido):
```bash
pnpm local:smoke
```

4. Levantar API en modo desarrollo:
```bash
pnpm dev:api
```

5. Levantar Web en modo desarrollo:
```bash
pnpm dev:web
```

6. Ver logs de infraestructura:
```bash
pnpm local:logs
```

7. Bajar infraestructura:
```bash
pnpm local:down
```

---

## Flujo diario recomendado

1. Inicio de sesion tecnica:
- `pnpm local:up`
- `pnpm local:status`
- `pnpm local:smoke`

2. Trabajo de desarrollo:
- Terminal A: `pnpm dev:api`
- Terminal B: `pnpm dev:web`

3. Control de calidad antes de integrar:
- `pnpm check:pre-commit`
- `pnpm check:pre-push`

4. Cierre de sesion:
- `pnpm local:down`

---

## Politica operativa local

1. No usar comandos ad-hoc si existe comando oficial en `package.json`.
2. Toda validacion de integracion debe pasar por `check:pre-push`.
3. Si falla `local:smoke`, no avanzar a pruebas e2e ni commit.
4. Mantener trazabilidad en acta cuando haya desviaciones o bloqueos.

---

## Manejo de fallos frecuentes

1. Puerto ocupado (`4000`, `5173`, `5432`, `6379`):
- Liberar proceso en conflicto o reiniciar Docker Desktop.

2. API no responde en `local:smoke`:
- Confirmar contenedores (`pnpm local:status`).
- Levantar API manualmente (`pnpm dev:api`) y repetir `pnpm local:smoke`.

3. Falla por DB no migrada:
- Ejecutar `pnpm db:generate`.
- Ejecutar `pnpm db:migrate:deploy`.
- Reintentar validaciones.

---

## Criterio de exito operativo diario

1. Infra local healthy.
2. Smoke local en PASS.
3. API/Web funcionales en dev.
4. `check:pre-commit` y `check:pre-push` en verde antes de push.
