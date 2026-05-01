param(
  [string]$ImageName = $(if ($env:PIXLO_DOCKER_IMAGE) { $env:PIXLO_DOCKER_IMAGE } else { "pixlo-games:local-proof" }),
  [string]$ContainerName = $(if ($env:PIXLO_DOCKER_CONTAINER) { $env:PIXLO_DOCKER_CONTAINER } else { "pixlo-games-proof" }),
  [int]$HostPort = $(if ($env:PIXLO_DOCKER_HOST_PORT) { [int]$env:PIXLO_DOCKER_HOST_PORT } else { 3100 }),
  [string]$DatabaseUrl = $env:PIXLO_DOCKER_DATABASE_URL,
  [switch]$DryRun,
  [switch]$SkipBuild,
  [switch]$KeepContainer
)

$ErrorActionPreference = "Stop"

function Test-EnvFlag {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  return @("1", "true", "yes", "on") -contains $Value.ToLowerInvariant()
}

function Redact-DockerArgument {
  param([string]$Argument)

  if ($Argument -notlike "*=*") {
    return $Argument
  }

  $name = $Argument.Split("=", 2)[0]

  if ($name -match "(DATABASE_URL|PASSWORD|SECRET|TOKEN|KEY)$") {
    return "$name=<redacted>"
  }

  return $Argument
}

function Invoke-Docker {
  param([string[]]$Arguments)

  & docker @Arguments

  if ($LASTEXITCODE -ne 0) {
    $safeArguments = $Arguments | ForEach-Object { Redact-DockerArgument $_ }

    throw "docker $($safeArguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Remove-ProofContainer {
  param(
    [string]$Name,
    [string]$Label
  )

  $existing = & docker ps -aq --filter "name=^/$Name$"

  if ($existing) {
    $owned = & docker ps -aq --filter "name=^/$Name$" --filter "label=$Label"

    if (-not $owned) {
      throw "Container name '$Name' already exists but was not created by this proof script. Choose another name or remove it manually."
    }

    & docker rm -f $Name | Out-Null
  }
}

function Wait-ForRoute {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastError = ""

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5

      if ($response.StatusCode -eq 200) {
        return
      }

      $lastError = "received HTTP $($response.StatusCode)"
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds 2
  }

  throw "$Url did not become ready within $TimeoutSeconds seconds. Last error: $lastError"
}

function Assert-HealthSignals {
  param(
    [string]$BaseUrl,
    [int]$MinPublicGames
  )

  $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 10

  if ($health.data.database -ne "reachable") {
    throw "/api/health database expected reachable but received $($health.data.database)."
  }

  $publicPlayableGames =
    if ($null -ne $health.data.checks.publicPlayableGames) {
      [int]$health.data.checks.publicPlayableGames
    } else {
      [int]$health.data.checks.publicGames
    }

  if ($publicPlayableGames -lt $MinPublicGames) {
    throw "/api/health public playable games expected at least $MinPublicGames but received $publicPlayableGames."
  }
}

function Get-ContainerHealth {
  param([string]$Name)

  $status = & docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $Name

  if ($LASTEXITCODE -ne 0) {
    return "unknown"
  }

  return $status
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$baseUrl = "http://127.0.0.1:$HostPort"
$proofLabel = "com.pixlogames.proof=docker-proof"

if (-not $DatabaseUrl -and $env:DATABASE_URL) {
  $DatabaseUrl = $env:DATABASE_URL
}

$csrfSecret =
  if ($env:PIXLO_DOCKER_CSRF_SECRET) {
    $env:PIXLO_DOCKER_CSRF_SECRET
  } else {
    "docker-proof-local-csrf-secret-change-before-hosting"
  }
$adminEmail =
  if ($env:PIXLO_DOCKER_ADMIN_EMAIL) {
    $env:PIXLO_DOCKER_ADMIN_EMAIL
  } else {
    "docker-proof@example.com"
  }
$adminPassword =
  if ($env:PIXLO_DOCKER_ADMIN_PASSWORD) {
    $env:PIXLO_DOCKER_ADMIN_PASSWORD
  } else {
    "docker-proof-local-admin-password"
  }
$expectedPublicGames =
  if ($env:PIXLO_DOCKER_EXPECTED_PUBLIC_GAME_COUNT) {
    $env:PIXLO_DOCKER_EXPECTED_PUBLIC_GAME_COUNT
  } else {
    "1"
  }

if ($DryRun) {
  Write-Host "Dry run only. No Docker build, container start, smoke check, or cleanup was executed."
  Write-Host "Image: $ImageName"
  Write-Host "Container: $ContainerName"
  Write-Host "Local URL: $baseUrl"
  Write-Host "Database URL: $(if ($DatabaseUrl) { 'configured (redacted)' } else { 'missing' })"
  Write-Host "Build secret: id=database_url,env=PIXLO_DOCKER_DATABASE_URL"
  Write-Host "Container label: $proofLabel"
  Write-Host "Expected public playable games: $expectedPublicGames"
  exit 0
}

if (-not $DatabaseUrl) {
  throw "Set PIXLO_DOCKER_DATABASE_URL to a PostgreSQL URL reachable from inside the container."
}

if (
  $DatabaseUrl -match "@(localhost|127\.0\.0\.1|\[::1\])(:|/)" -and
  -not (Test-EnvFlag $env:PIXLO_DOCKER_ALLOW_LOCALHOST_DB)
) {
  throw "PIXLO_DOCKER_DATABASE_URL uses localhost/127.0.0.1, which usually points at the container itself. Use a container-reachable host such as host.docker.internal, or set PIXLO_DOCKER_ALLOW_LOCALHOST_DB=1 if this is intentional."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker CLI is not available on PATH."
}

& docker version | Out-Null

if ($LASTEXITCODE -ne 0) {
  throw "Docker is not available or the Docker daemon is not running."
}

if (-not $SkipBuild) {
  Write-Host "Building Docker image $ImageName..."
  $previousBuildKit = $env:DOCKER_BUILDKIT
  $previousDockerDatabaseUrl = $env:PIXLO_DOCKER_DATABASE_URL
  $env:DOCKER_BUILDKIT = "1"
  $env:PIXLO_DOCKER_DATABASE_URL = $DatabaseUrl

  try {
    Invoke-Docker -Arguments @(
      "build",
      "--secret",
      "id=database_url,env=PIXLO_DOCKER_DATABASE_URL",
      "-t",
      $ImageName,
      $repoRoot
    )
  } finally {
    if ($null -eq $previousBuildKit) {
      Remove-Item Env:DOCKER_BUILDKIT -ErrorAction SilentlyContinue
    } else {
      $env:DOCKER_BUILDKIT = $previousBuildKit
    }

    if ($null -eq $previousDockerDatabaseUrl) {
      Remove-Item Env:PIXLO_DOCKER_DATABASE_URL -ErrorAction SilentlyContinue
    } else {
      $env:PIXLO_DOCKER_DATABASE_URL = $previousDockerDatabaseUrl
    }
  }
}

Remove-ProofContainer -Name $ContainerName -Label $proofLabel

$runArgs = @(
  "run",
  "-d",
  "--name",
  $ContainerName,
  "--label",
  $proofLabel,
  "-p",
  "${HostPort}:3000",
  "-e",
  "DATABASE_URL=$DatabaseUrl",
  "-e",
  "NEXT_PUBLIC_SITE_URL=$baseUrl",
  "-e",
  "PIXLO_ENVIRONMENT_MODE=staging",
  "-e",
  "NEXT_PUBLIC_PIXLO_ENVIRONMENT_MODE=staging",
  "-e",
  "PIXLO_DEPLOYMENT_TARGET=self-hosted",
  "-e",
  "PIXLO_HOSTING_TARGET=container",
  "-e",
  "PIXLO_ROLLOUT_STAGE=private_beta",
  "-e",
  "PIXLO_PUBLIC_LAUNCH_ENABLED=0",
  "-e",
  "PIXLO_CSRF_SECRET=$csrfSecret",
  "-e",
  "PIXLO_INTERNAL_ADMIN_EMAIL=$adminEmail",
  "-e",
  "PIXLO_INTERNAL_ADMIN_PASSWORD=$adminPassword",
  "-e",
  "PIXLO_EXPECTED_PUBLIC_GAME_COUNT=$expectedPublicGames",
  $ImageName
)

try {
  Write-Host "Starting Docker container $ContainerName on $baseUrl..."
  Invoke-Docker -Arguments $runArgs

  Write-Host "Waiting for $baseUrl/api/health..."
  Wait-ForRoute -Url "$baseUrl/api/health"
  Assert-HealthSignals -BaseUrl $baseUrl -MinPublicGames ([int]$expectedPublicGames)

  $smokeScript = Join-Path $PSScriptRoot "deployment-smoke.ps1"
  Write-Host "Running PixloGames smoke checks against $baseUrl..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File $smokeScript -BaseUrl $baseUrl -AllowDegraded

  if ($LASTEXITCODE -ne 0) {
    throw "Docker smoke verification failed with exit code $LASTEXITCODE."
  }

  $health = Get-ContainerHealth -Name $ContainerName

  if ($health -eq "unhealthy") {
    throw "Docker container health check reported unhealthy."
  }

  if ($health -eq "healthy") {
    Write-Host "Docker health check status: healthy"
  } else {
    Write-Host "Docker health check status: $health"
  }

  Write-Host "PixloGames Docker proof passed for $baseUrl"
} catch {
  Write-Host ""
  Write-Host "Last Docker logs for ${ContainerName}:"
  & docker logs --tail 120 $ContainerName
  throw
} finally {
  if (-not $KeepContainer) {
    Remove-ProofContainer -Name $ContainerName -Label $proofLabel
  } else {
    Write-Host "Keeping container $ContainerName running for inspection."
  }
}
