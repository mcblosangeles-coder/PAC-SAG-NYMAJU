Param(
  [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"

Write-Host "==> PAC NYMAJU SPR | DB init"

if (-not $SkipDocker) {
  Write-Host "==> Levantando servicios Docker..."
  pnpm docker:up
}

Write-Host "==> Generando cliente Prisma..."
pnpm db:generate

Write-Host "==> Aplicando migración inicial..."
pnpm db:migrate

Write-Host "==> Ejecutando seed..."
pnpm db:seed

Write-Host "==> DB init completado."
