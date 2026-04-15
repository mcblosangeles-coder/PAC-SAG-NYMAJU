# M5-B1-02 - Estandar de refresh dataset QA/UAT

## Objetivo

Estandarizar la ejecucion del refresh del dataset operativo para evitar deriva entre ciclos QA/UAT y asegurar evidencia comparable.

## Alcance

Aplica a:

1. entorno local QA/UAT del proyecto;
2. dataset oficial definido en `M5-B1-01`;
3. validacion funcional F1-F5 posterior a refresh.

## Comando estandar oficial

### Refresh normal (uso diario)

```powershell
pnpm dataset:refresh
```

### Refresh completo (recuperacion)

```powershell
pnpm dataset:refresh:full
```

## Script oficial

- Archivo: `scripts/refresh-dataset-qa.ps1`
- Modos:
  1. `standard` -> ejecuta `db:seed`
  2. `full` -> ejecuta `db:reset` + `db:seed`
- Verificacion opcional API:
  - agregar `-RunApiChecks`

Ejemplo:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/refresh-dataset-qa.ps1 -Mode standard -RunApiChecks
```

## Checklist de control por corrida

1. Confirmar rama y commit de trabajo.
2. Ejecutar refresh en modo correcto (`standard` o `full`).
3. Confirmar login operativo (`admin@pac.local`) exitoso.
4. Confirmar carga de resumen F2 para los 3 IDs oficiales:
   - `35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431`
   - `b84fb315-bf65-40d4-86ff-6e4a52149965`
   - `0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8`
5. Validar casos de control:
   - F5 positivo en `PAC-VERIF-001` (`200` esperado).
   - F4 con bloqueo en `PAC-VERIF-002` (`422` esperado).
6. Registrar evidencia minima en acta o bitacora de ciclo.

## Criterios de consistencia QA/UAT

Un ciclo se considera consistente cuando:

1. refresh termina sin errores;
2. script devuelve dataset oficial disponible;
3. expected outcomes del dataset oficial se mantienen;
4. no hay diferencias funcionales no explicadas respecto del ciclo previo.

## Politica de uso

1. Antes de cualquier validacion funcional M5, ejecutar refresh.
2. Si hay falla estructural de datos, escalar a modo `full`.
3. No validar resultados funcionales sobre base no refrescada.

## Evidencia minima requerida

1. fecha/hora;
2. comando ejecutado;
3. resultado de refresh;
4. resultado de checks F2/F4/F5;
5. observaciones.

## Criterio de cierre M5-B1-02

1. existe comando estandar unico;
2. existe script reusable;
3. existe checklist operativo de control;
4. existe politica de uso para QA/UAT.

Estado: **IMPLEMENTADO**.
