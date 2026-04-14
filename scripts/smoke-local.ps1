Param(
  [string]$ApiBaseUrl = "http://localhost:4000/api/v1",
  [string]$WorkflowProbePath = "/expedientes/EXP-SMOKE/workflow",
  [int]$ApiWaitSeconds = 30,
  [bool]$AutoStartApi = $true
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "==> $Message"
}

function Read-ResponseBody([System.Net.WebResponse]$Response) {
  if ($null -eq $Response) {
    return ""
  }

  $stream = $Response.GetResponseStream()
  if ($null -eq $stream) {
    return ""
  }

  $reader = New-Object System.IO.StreamReader($stream)
  try {
    return $reader.ReadToEnd()
  } finally {
    $reader.Dispose()
    $stream.Dispose()
  }
}

function Invoke-Http([string]$Url) {
  $request = [System.Net.HttpWebRequest]::Create($Url)
  $request.Method = "GET"
  $request.Accept = "application/json"
  $request.Timeout = 5000

  try {
    $response = [System.Net.HttpWebResponse]$request.GetResponse()
    $body = Read-ResponseBody $response
    return @{
      StatusCode = [int]$response.StatusCode
      Body = $body
    }
  } catch [System.Net.WebException] {
    $errorResponse = [System.Net.HttpWebResponse]$_.Exception.Response
    if ($null -eq $errorResponse) {
      throw
    }

    $body = Read-ResponseBody $errorResponse
    return @{
      StatusCode = [int]$errorResponse.StatusCode
      Body = $body
    }
  }
}

function Assert-ContainerRunningHealthy([string]$ContainerName) {
  $containerId = (docker ps -q -f "name=^${ContainerName}$").Trim()
  if ([string]::IsNullOrWhiteSpace($containerId)) {
    throw "Container '$ContainerName' no esta en ejecucion."
  }

  $health = (docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName).Trim()
  if ($health -ne "healthy" -and $health -ne "none") {
    throw "Container '$ContainerName' no esta healthy (estado actual: $health)."
  }
}

function Wait-ForApi([string]$Url, [int]$WaitSeconds) {
  $deadline = (Get-Date).AddSeconds($WaitSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $candidate = Invoke-Http $Url
      if ($candidate.StatusCode -eq 200) {
        return $candidate
      }
    } catch {
      Start-Sleep -Seconds 1
      continue
    }
    Start-Sleep -Seconds 1
  }
  return $null
}

Write-Step "PAC NYMAJU SPR | Smoke test local"
Write-Step "Validando contenedores base (Postgres y Redis)..."
Assert-ContainerRunningHealthy "pac-postgres"
Assert-ContainerRunningHealthy "pac-redis"

$healthUrl = "$ApiBaseUrl/health"
Write-Step "Esperando API health en $healthUrl (timeout: ${ApiWaitSeconds}s)..."
$apiProcess = $null

try {
  $healthResponse = Wait-ForApi -Url $healthUrl -WaitSeconds $ApiWaitSeconds

  if ($null -eq $healthResponse -and $AutoStartApi) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
    Write-Step "API no disponible. Intentando levantar '@pac/api dev' temporalmente..."

    if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
      $env:DATABASE_URL = "postgresql://pac_user:pac_password@localhost:5432/pac_nymaju_spr?schema=public"
    }
    if ([string]::IsNullOrWhiteSpace($env:REDIS_URL)) {
      $env:REDIS_URL = "redis://localhost:6379"
    }
    if ([string]::IsNullOrWhiteSpace($env:JWT_ACCESS_SECRET)) {
      $env:JWT_ACCESS_SECRET = "smoke_access_secret"
    }
    if ([string]::IsNullOrWhiteSpace($env:JWT_REFRESH_SECRET)) {
      $env:JWT_REFRESH_SECRET = "smoke_refresh_secret"
    }

    $apiProcess = Start-Process `
      -FilePath "pnpm.cmd" `
      -ArgumentList "--filter", "@pac/api", "dev" `
      -WorkingDirectory $repoRoot `
      -PassThru `
      -WindowStyle Hidden

    $healthResponse = Wait-ForApi -Url $healthUrl -WaitSeconds $ApiWaitSeconds
  }

  if ($null -eq $healthResponse) {
    throw "API no disponible en $healthUrl. Levanta la API con 'pnpm dev' o 'pnpm --filter @pac/api dev'."
  }

  $healthJson = $healthResponse.Body | ConvertFrom-Json
  if ($healthJson.service -ne "api" -or $healthJson.status -ne "ok") {
    throw "Health response invalida. service='$($healthJson.service)' status='$($healthJson.status)'."
  }

  Write-Step "Health API OK."

  $workflowUrl = "$ApiBaseUrl$WorkflowProbePath"
  Write-Step "Validando endpoint protegido (debe responder 401 UNAUTHENTICATED) en $workflowUrl ..."
  $workflowResponse = Invoke-Http $workflowUrl
  if ($workflowResponse.StatusCode -ne 401) {
    throw "Endpoint protegido respondio status inesperado: $($workflowResponse.StatusCode). Se esperaba 401."
  }

  $workflowJson = $workflowResponse.Body | ConvertFrom-Json
  if ($workflowJson.code -ne "UNAUTHENTICATED") {
    throw "Contrato de error invalido en endpoint protegido. code='$($workflowJson.code)' esperado='UNAUTHENTICATED'."
  }

  Write-Step "Smoke test local completado: PASS"
} finally {
  if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id -Force
    Write-Step "Proceso temporal de API detenido."
  }
}
