# M5-H1 - Checklist Rapido Local (Pre-commit / Pre-push)

## Objetivo
Definir un control rapido, repetible y obligatorio antes de integrar cambios.

## Pre-commit (rapido, foco codigo API)

Comando oficial:

```bash
pnpm check:pre-commit
```

Incluye:
1. `@pac/api typecheck`
2. `@pac/api test:unit`

Criterio PASS:
1. Sin errores TypeScript.
2. Unit tests en verde.

Si falla:
1. No commitear.
2. Corregir causa raiz.
3. Repetir `check:pre-commit`.

---

## Pre-push (integracion minima obligatoria)

Comando oficial:

```bash
pnpm check:pre-push
```

Incluye:
1. `preflight:local` (docker up + smoke + typecheck API + unit API + e2e API)
2. `@pac/web build`

Criterio PASS:
1. `preflight:local` en PASS.
2. Build web en verde.

Si falla:
1. No hacer push.
2. Registrar bloqueo en acta si no se resuelve en la sesion.

---

## Secuencia minima obligatoria

1. Antes de `git commit`:
- `pnpm check:pre-commit`

2. Antes de `git push`:
- `pnpm check:pre-push`

3. Si ambos estan en PASS:
- Se autoriza commit/push.

---

## Evidencia recomendada por sesion

1. Captura de salida de `check:pre-commit`.
2. Captura de salida de `check:pre-push`.
3. Commit hash asociado a la validacion.
