param(
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 5175,
  [int]$BackendFallbackStart = 8010,
  [int]$BackendFallbackEnd = 8099,
  [int]$FrontendFallbackStart = 5174,
  [int]$FrontendFallbackEnd = 5199
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BackendRoot = Join-Path $ProjectRoot "backend"
$FrontendRoot = Join-Path $ProjectRoot "frontend"
$LogRoot = Join-Path $ProjectRoot "tmp\local-dev"
New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null

function Test-PortFree {
  param([int]$Port)
  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -eq $listener
}

function Select-DevPort {
  param(
    [int]$Preferred,
    [int]$FallbackStart,
    [int]$FallbackEnd,
    [string]$Label
  )

  if (Test-PortFree -Port $Preferred) {
    return $Preferred
  }

  $candidate = $FallbackStart
  while ($candidate -le $FallbackEnd) {
    if (Test-PortFree -Port $candidate) {
      Write-Host "$Label port $Preferred is busy; using $candidate for this run."
      return $candidate
    }
    $candidate += 1
  }

  throw "$Label has no free port: $Preferred or $FallbackStart-$FallbackEnd are busy."
}

function Wait-Json {
  param(
    [string]$Uri,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      return Invoke-RestMethod -Uri $Uri -TimeoutSec 3
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "Timed out waiting for API: $Uri"
}

function Wait-HttpOk {
  param(
    [string]$Uri,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "Timed out waiting for page: $Uri"
}

$SelectedBackendPort = Select-DevPort -Preferred $BackendPort -FallbackStart $BackendFallbackStart -FallbackEnd $BackendFallbackEnd -Label "Backend"
$SelectedFrontendPort = Select-DevPort -Preferred $FrontendPort -FallbackStart $FrontendFallbackStart -FallbackEnd $FrontendFallbackEnd -Label "Frontend"

$BackendOut = Join-Path $LogRoot "backend-$SelectedBackendPort.out.log"
$BackendErr = Join-Path $LogRoot "backend-$SelectedBackendPort.err.log"
$FrontendOut = Join-Path $LogRoot "frontend-$SelectedFrontendPort.out.log"
$FrontendErr = Join-Path $LogRoot "frontend-$SelectedFrontendPort.err.log"
$StatusFile = Join-Path $LogRoot "last-start.json"

$backendProcess = Start-Process -WindowStyle Hidden -WorkingDirectory $BackendRoot -FilePath "python" -ArgumentList @(
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  "$SelectedBackendPort"
) -RedirectStandardOutput $BackendOut -RedirectStandardError $BackendErr -PassThru

$health = Wait-Json -Uri "http://127.0.0.1:$SelectedBackendPort/health"
if ($health.status -ne "ok" -or $health.service -ne "ai-ads-signal-workbench") {
  throw "Backend health check is not this project: $($health | ConvertTo-Json -Compress)"
}

$openapi = Wait-Json -Uri "http://127.0.0.1:$SelectedBackendPort/openapi.json"
if ($openapi.info.title -ne "AI Ads Signal Workbench") {
  throw "Backend OpenAPI title is not this project: $($openapi.info.title)"
}

$ApiBase = "http://127.0.0.1:$SelectedBackendPort"
$frontendCommand = "`$env:VITE_API_BASE_URL='$ApiBase'; npm run dev -- --port $SelectedFrontendPort --strictPort"
$frontendProcess = Start-Process -WindowStyle Hidden -WorkingDirectory $FrontendRoot -FilePath "powershell.exe" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  $frontendCommand
) -RedirectStandardOutput $FrontendOut -RedirectStandardError $FrontendErr -PassThru

Wait-HttpOk -Uri "http://127.0.0.1:$SelectedFrontendPort/"

$result = [ordered]@{
  status = "ready"
  frontend_url = "http://127.0.0.1:$SelectedFrontendPort/"
  api_base = $ApiBase
  backend_pid = $backendProcess.Id
  frontend_pid = $frontendProcess.Id
  backend_log = $BackendOut
  frontend_log = $FrontendOut
}

$resultJson = $result | ConvertTo-Json
Set-Content -Path $StatusFile -Value $resultJson -Encoding UTF8
Write-Output $resultJson
