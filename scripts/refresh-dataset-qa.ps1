Param(
  [ValidateSet("standard", "full")]
  [string]$Mode = "standard",
  [switch]$RunApiChecks
)

$ErrorActionPreference = "Stop"

Write-Host "==> PAC NYMAJU SPR | Refresh dataset QA/UAT"
Write-Host "==> Mode: $Mode"

if ($Mode -eq "full") {
  Write-Host "==> Step 1/2: db:reset"
  pnpm db:reset
  Write-Host "==> Step 2/2: db:seed"
  pnpm db:seed
} else {
  Write-Host "==> Step 1/1: db:seed"
  pnpm db:seed
}

if ($RunApiChecks) {
  Write-Host "==> Running API validation checks..."

  $baseUrl = if ($env:DATASET_BASE_URL) { $env:DATASET_BASE_URL } else { "http://localhost:4000" }

  $health = Invoke-RestMethod -Uri "$baseUrl/api/v1/health" -Method GET
  if ($health.status -ne "ok") {
    throw "Health check failed. status=$($health.status)"
  }

  $login = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pac.local","password":"ChangeMe_123!"}'
  $token = $login.tokens.accessToken
  if (-not $token) {
    throw "Login check failed: access token not returned."
  }

  $headers = @{ Authorization = "Bearer $token" }

  $ids = @(
    "35b2a855-ccfb-4c0e-a9d3-fdd92bbc1431",
    "b84fb315-bf65-40d4-86ff-6e4a52149965",
    "0bfc8a5f-c6df-4b54-a2ec-443d89f59dc8"
  )

  foreach ($id in $ids) {
    $summary = Invoke-RestMethod -Uri "$baseUrl/api/v1/expedientes/$id" -Headers $headers -Method GET
    if (-not $summary.expedienteId) {
      throw "Summary check failed for expediente $id"
    }
  }

  Write-Host "==> API checks completed: OK"
}

Write-Host "==> Dataset refresh completed."
