Param(
  [switch]$SkipDockerUp
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "==> $Message"
}

Write-Step "PAC NYMAJU SPR | Preflight local"

if (-not $SkipDockerUp) {
  Write-Step "Paso 1/5: docker:up"
  pnpm docker:up
} else {
  Write-Step "Paso 1/5: docker:up (omitido por flag -SkipDockerUp)"
}

Write-Step "Paso 2/5: smoke:local"
pnpm smoke:local

Write-Step "Paso 3/5: typecheck API"
pnpm --filter @pac/api typecheck

Write-Step "Paso 4/5: unit tests API"
pnpm --filter @pac/api test:unit

Write-Step "Paso 5/5: e2e tests API"
pnpm --filter @pac/api test:e2e

Write-Step "Preflight local completado: PASS"
