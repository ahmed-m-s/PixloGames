param(
  [string]$BaseUrl = $env:PIXLO_SMOKE_BASE_URL,
  [string]$AdminEmail = $env:PIXLO_SMOKE_ADMIN_EMAIL,
  [string]$AdminPassword = $env:PIXLO_SMOKE_ADMIN_PASSWORD,
  [string]$ExpectedEnvironmentMode = $env:PIXLO_SMOKE_EXPECTED_ENVIRONMENT_MODE,
  [string]$ExpectedRolloutStage = $env:PIXLO_SMOKE_EXPECTED_ROLLOUT_STAGE,
  [string]$ExpectedHostingTarget = $env:PIXLO_SMOKE_EXPECTED_HOSTING_TARGET,
  [string]$ExpectedDeploymentTarget = $env:PIXLO_SMOKE_EXPECTED_DEPLOYMENT_TARGET,
  [int]$MinPublicGames = $(if ($env:PIXLO_SMOKE_MIN_PUBLIC_GAMES) { [int]$env:PIXLO_SMOKE_MIN_PUBLIC_GAMES } else { 1 }),
  [switch]$AllowDegraded,
  [switch]$ReleaseVerify,
  [switch]$RequireAuthenticated,
  [switch]$RequireControlledBetaReady,
  [switch]$RequireProductionReady
)

if (-not $BaseUrl) {
  $BaseUrl = "http://localhost:3000"
}

$BaseUrl = $BaseUrl.TrimEnd("/")
$failures = New-Object System.Collections.Generic.List[string]
$releaseWarnings = New-Object System.Collections.Generic.List[string]

function Test-EnvFlag {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  return @("1", "true", "yes", "on") -contains $Value.ToLowerInvariant()
}

if (Test-EnvFlag $env:PIXLO_SMOKE_ALLOW_DEGRADED) {
  $AllowDegraded = $true
}

if (Test-EnvFlag $env:PIXLO_SMOKE_RELEASE_VERIFY) {
  $ReleaseVerify = $true
}

if (Test-EnvFlag $env:PIXLO_SMOKE_REQUIRE_AUTHENTICATED) {
  $RequireAuthenticated = $true
}

if (Test-EnvFlag $env:PIXLO_SMOKE_REQUIRE_CONTROLLED_BETA_READY) {
  $RequireControlledBetaReady = $true
}

if (Test-EnvFlag $env:PIXLO_SMOKE_REQUIRE_PRODUCTION_READY) {
  $RequireProductionReady = $true
}

function Invoke-SmokeRoute {
  param(
    [string]$Path,
    [string]$Expected,
    [string]$Method = "GET",
    [string]$CookieFile = ""
  )

  $url = "$BaseUrl$Path"
  $args = @("-s", "-o", "NUL", "-w", "%{http_code}", "--max-time", "30", "-X", $Method)

  if ($CookieFile) {
    $args += @("-b", $CookieFile)
  }

  $args += $url
  $status = & curl.exe @args

  if ($status -ne $Expected) {
    $script:failures.Add("$Method $Path expected $Expected but received $status")
  }

  [PSCustomObject]@{
    Method = $Method
    Path = $Path
    Expected = $Expected
    Status = $status
  }
}

function Invoke-SmokeJson {
  param(
    [string]$Path,
    [string]$CookieFile = ""
  )

  $url = "$BaseUrl$Path"
  $bodyFile = New-TemporaryFile
  $args = @("-s", "-o", $bodyFile.FullName, "-w", "%{http_code}", "--max-time", "30")

  if ($CookieFile) {
    $args += @("-b", $CookieFile)
  }

  $args += $url
  $status = & curl.exe @args
  $body = Get-Content -Raw -LiteralPath $bodyFile.FullName
  Remove-Item -LiteralPath $bodyFile.FullName -Force -ErrorAction SilentlyContinue

  if ($status -ne "200") {
    $script:failures.Add("GET $Path expected 200 but received $status")
    return $null
  }

  try {
    return $body | ConvertFrom-Json
  } catch {
    $script:failures.Add("GET $Path returned non-JSON response")
    return $null
  }
}

function Assert-Equal {
  param(
    [string]$Label,
    [string]$Actual,
    [string]$Expected
  )

  if ($Expected -and $Actual -ne $Expected) {
    $script:failures.Add("$Label expected '$Expected' but received '$Actual'")
  }
}

function Get-HeaderValue {
  param(
    [string]$Headers,
    [string]$Name
  )

  $match = [regex]::Match($Headers, "(?im)^$([regex]::Escape($Name)):\s*(.+)$")

  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }

  return ""
}

function Test-InternalSessionCookie {
  param([string]$CookieFile)

  if (!(Test-Path -LiteralPath $CookieFile)) {
    return $false
  }

  $cookieContent = Get-Content -Raw -LiteralPath $CookieFile

  return $cookieContent -match '(^|\s)(__Host-)?pixlo_internal_session(\s|$)'
}

function Assert-ReleaseSignals {
  param(
    [object]$Health,
    [object]$Monitoring
  )

  if (!$Health -or !$Monitoring) {
    return
  }

  $healthData = $Health.data
  $monitoringData = $Monitoring.data

  if ($healthData.database -ne "reachable") {
    $script:failures.Add("/api/health database expected reachable but received $($healthData.database)")
  }

  if (!$AllowDegraded -and $healthData.status -ne "ok") {
    $script:failures.Add("/api/health status expected ok but received $($healthData.status). Set PIXLO_SMOKE_ALLOW_DEGRADED=1 only for intentional staging watch states.")
  }

  if ($monitoringData.status -eq "degraded") {
    $script:releaseWarnings.Add("/api/monitoring/status is degraded with alert level $($monitoringData.alertLevel).")
  }

  if (!$AllowDegraded -and $monitoringData.status -ne "ok") {
    $script:failures.Add("/api/monitoring/status expected ok but received $($monitoringData.status).")
  }

  Assert-Equal -Label "environmentMode" -Actual $monitoringData.deployment.environmentMode -Expected $ExpectedEnvironmentMode
  Assert-Equal -Label "rolloutStage" -Actual $monitoringData.deployment.rolloutStage -Expected $ExpectedRolloutStage
  Assert-Equal -Label "hostingTarget" -Actual $monitoringData.deployment.hostingTarget -Expected $ExpectedHostingTarget
  Assert-Equal -Label "deploymentTarget" -Actual $monitoringData.deployment.deploymentTarget -Expected $ExpectedDeploymentTarget

  if ($healthData.checks.publicGames -lt $MinPublicGames) {
    $script:failures.Add("publicGames expected at least $MinPublicGames but received $($healthData.checks.publicGames)")
  }

  if ($monitoringData.providerRequirements.blocked -gt 0) {
    $script:failures.Add("providerRequirements has $($monitoringData.providerRequirements.blocked) blocked item(s).")
  }

  if ($monitoringData.rollout.blockers -gt 0) {
    $script:releaseWarnings.Add("rollout reports $($monitoringData.rollout.blockers) blocker(s).")
  }

  if ($RequireControlledBetaReady -and !$monitoringData.rollout.controlledBetaReady) {
    $script:failures.Add("controlledBetaReady expected true but received false.")
  }

  if ($RequireProductionReady -and !$monitoringData.rollout.productionReady) {
    $script:failures.Add("productionReady expected true but received false.")
  }
}

$results = @()
$results += Invoke-SmokeRoute -Path "/" -Expected "200"
$results += Invoke-SmokeRoute -Path "/games" -Expected "200"
$results += Invoke-SmokeRoute -Path "/api/health" -Expected "200"
$results += Invoke-SmokeRoute -Path "/api/monitoring/status" -Expected "200"
$results += Invoke-SmokeRoute -Path "/internal/sign-in" -Expected "200"
$results += Invoke-SmokeRoute -Path "/internal/readiness" -Expected "307"
$results += Invoke-SmokeRoute -Path "/api/internal/deployment/plan" -Expected "401"

$health = Invoke-SmokeJson -Path "/api/health"
$monitoring = Invoke-SmokeJson -Path "/api/monitoring/status"

if ($ReleaseVerify) {
  Assert-ReleaseSignals -Health $health -Monitoring $monitoring
}

if ($AdminEmail -and $AdminPassword) {
  $cookieFile = Join-Path $env:TEMP "pixlogames-smoke-cookies.txt"
  $signInHeadersFile = Join-Path $env:TEMP "pixlogames-smoke-signin-headers.txt"
  Remove-Item -LiteralPath $cookieFile -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $signInHeadersFile -ErrorAction SilentlyContinue

  $signInStatus = & curl.exe -s -o NUL -D $signInHeadersFile -w "%{http_code}" -c $cookieFile -X POST `
    -d "email=$AdminEmail" `
    -d "password=$AdminPassword" `
    -d "next=/internal/readiness" `
    --max-time 30 `
    "$BaseUrl/api/internal/auth/sign-in"
  $signInHeaders = if (Test-Path -LiteralPath $signInHeadersFile) {
    Get-Content -Raw -LiteralPath $signInHeadersFile
  } else {
    ""
  }
  $signInLocation = Get-HeaderValue -Headers $signInHeaders -Name "Location"
  $hasInternalSessionCookie = Test-InternalSessionCookie -CookieFile $cookieFile

  $results += [PSCustomObject]@{
    Method = "POST"
    Path = "/api/internal/auth/sign-in"
    Expected = "303"
    Status = $signInStatus
  }

  if ($signInStatus -ne "303") {
    $failures.Add("POST /api/internal/auth/sign-in expected 303 but received $signInStatus")
  } elseif ($signInLocation -match '/internal/sign-in\?error=invalid') {
    $failures.Add("POST /api/internal/auth/sign-in redirected back to sign-in with invalid credentials. Check PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD.")
  } elseif (!$hasInternalSessionCookie) {
    $failures.Add("POST /api/internal/auth/sign-in returned 303 but no internal session cookie was captured. The authenticated follow-up requests would not carry session state.")
  } else {
    $results += Invoke-SmokeRoute -Path "/internal/readiness" -Expected "200" -CookieFile $cookieFile
    $results += Invoke-SmokeRoute -Path "/internal/diagnostics" -Expected "200" -CookieFile $cookieFile
    $results += Invoke-SmokeRoute -Path "/api/internal/deployment/plan" -Expected "200" -CookieFile $cookieFile
    $results += Invoke-SmokeRoute -Path "/api/internal/integrations/status" -Expected "200" -CookieFile $cookieFile
  }

  Remove-Item -LiteralPath $cookieFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $signInHeadersFile -Force -ErrorAction SilentlyContinue
} else {
  Write-Host "Skipping authenticated smoke checks. Set PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD to include them."

  if ($RequireAuthenticated) {
    $failures.Add("Authenticated release checks were required but PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD were not both set.")
  }
}

$results | Format-Table -AutoSize

if ($ReleaseVerify) {
  Write-Host ""
  Write-Host "Release verification signals:"

  if ($health -and $monitoring) {
    [PSCustomObject]@{
      BaseUrl = $BaseUrl
      HealthStatus = $health.data.status
      Database = $health.data.database
      PublicGames = $health.data.checks.publicGames
      EnvironmentMode = $monitoring.data.deployment.environmentMode
      RolloutStage = $monitoring.data.deployment.rolloutStage
      HostingTarget = $monitoring.data.deployment.hostingTarget
      DeploymentTarget = $monitoring.data.deployment.deploymentTarget
      ControlledBetaReady = $monitoring.data.rollout.controlledBetaReady
      ProductionReady = $monitoring.data.rollout.productionReady
      ProviderBlocks = $monitoring.data.providerRequirements.blocked
      ProviderWarnings = $monitoring.data.providerRequirements.warning
    } | Format-List
  }

  if ($releaseWarnings.Count -gt 0) {
    Write-Warning ("Release verification warnings:`n" + ($releaseWarnings -join "`n"))
  }
}

if ($failures.Count -gt 0) {
  Write-Error ("Smoke check failed:`n" + ($failures -join "`n"))
  exit 1
}

Write-Host "PixloGames smoke checks passed for $BaseUrl"
