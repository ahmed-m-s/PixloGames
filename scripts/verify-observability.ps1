param(
  [string]$BaseUrl = $env:PIXLO_OBSERVABILITY_BASE_URL,
  [string]$AdminEmail = $env:PIXLO_OBSERVABILITY_ADMIN_EMAIL,
  [string]$AdminPassword = $env:PIXLO_OBSERVABILITY_ADMIN_PASSWORD,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $BaseUrl) {
  $BaseUrl = $env:PIXLO_SMOKE_BASE_URL
}

if (-not $AdminEmail) {
  $AdminEmail = $env:PIXLO_SMOKE_ADMIN_EMAIL
}

if (-not $AdminPassword) {
  $AdminPassword = $env:PIXLO_SMOKE_ADMIN_PASSWORD
}

if (-not $BaseUrl) {
  $BaseUrl = 'http://localhost:3000'
}

$BaseUrl = $BaseUrl.TrimEnd('/')
$failures = New-Object System.Collections.Generic.List[string]
$results = New-Object System.Collections.Generic.List[object]

function Get-SafeDisplayUrl {
  param([string]$Url)

  try {
    $builder = [System.UriBuilder]::new($Url)

    if ($builder.UserName -or $builder.Password) {
      $builder.UserName = '<redacted>'
      $builder.Password = '<redacted>'
    }

    return $builder.Uri.AbsoluteUri.TrimEnd('/')
  } catch {
    return '<invalid-url>'
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

  return ''
}

function Test-InternalSessionCookie {
  param([string]$CookieFile)

  if (!(Test-Path -LiteralPath $CookieFile)) {
    return $false
  }

  $cookieContent = Get-Content -Raw -LiteralPath $CookieFile

  return $cookieContent -match '(^|\s)(__Host-)?pixlo_internal_session(\s|$)'
}

function Invoke-JsonRequest {
  param(
    [string]$Path,
    [string]$Method = 'GET',
    [string]$CookieFile = '',
    [string]$CsrfToken = ''
  )

  $url = "$BaseUrl$Path"
  $bodyFile = New-TemporaryFile
  $args = @('-s', '-o', $bodyFile.FullName, '-w', '%{http_code}', '--max-time', '30', '-X', $Method)

  if ($CookieFile) {
    $args += @('-b', $CookieFile)
  }

  if ($CsrfToken) {
    $args += @('-H', "X-Pixlo-CSRF: $CsrfToken")
  }

  $args += $url
  $status = & curl.exe @args
  $body = Get-Content -Raw -LiteralPath $bodyFile.FullName
  Remove-Item -LiteralPath $bodyFile.FullName -Force -ErrorAction SilentlyContinue

  $json = $null

  try {
    if ($body) {
      $json = $body | ConvertFrom-Json
    }
  } catch {
    $json = $null
  }

  [PSCustomObject]@{
    Path = $Path
    Method = $Method
    Status = $status
    Json = $json
    Body = $body
  }
}

function ConvertTo-FormBody {
  param([hashtable]$Values)

  ($Values.GetEnumerator() | ForEach-Object {
    '{0}={1}' -f [uri]::EscapeDataString([string]$_.Key), [uri]::EscapeDataString([string]$_.Value)
  }) -join '&'
}

function Get-CsrfTokenFromHtml {
  param(
    [string]$Path,
    [string]$CookieFile
  )

  $url = "$BaseUrl$Path"
  $args = @('-s', '-L', '--max-time', '30', '-b', $CookieFile, $url)
  $html = & curl.exe @args
  $match = [regex]::Match(
    $html,
    '<input[^>]+name="_csrf"[^>]+value="([^"]+)"|<input[^>]+value="([^"]+)"[^>]+name="_csrf"',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  if ($match.Success) {
    foreach ($groupIndex in @(1, 2)) {
      $value = $match.Groups[$groupIndex].Value

      if ($value) {
        return $value
      }
    }
  }

  return ''
}

$safeBaseUrl = Get-SafeDisplayUrl -Url $BaseUrl

if ($DryRun) {
  Write-Host "Dry run only. No Sentry event, alert, sign-in, or HTTP request was sent."
  Write-Host "Target: $safeBaseUrl"
  Write-Host "Required credentials: PIXLO_OBSERVABILITY_ADMIN_EMAIL and PIXLO_OBSERVABILITY_ADMIN_PASSWORD, or PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD."
  Write-Host "Protected checks: /api/internal/sentry/test and /api/internal/alerts/test."
  exit 0
}

if (-not $AdminEmail -or -not $AdminPassword) {
  Write-Error 'Observability verification requires PIXLO_OBSERVABILITY_ADMIN_EMAIL and PIXLO_OBSERVABILITY_ADMIN_PASSWORD, or the PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD fallbacks.'
  exit 1
}

if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
  Write-Error 'Observability verification requires curl.exe.'
  exit 1
}

$monitoring = Invoke-JsonRequest -Path '/api/monitoring/status'
$results.Add([PSCustomObject]@{
  Step = 'Monitoring status'
  Path = '/api/monitoring/status'
  Status = $monitoring.Status
  Detail = if ($monitoring.Json) { $monitoring.Json.data.providerStatuses.alerts } else { 'non-json-response' }
})

if ($monitoring.Status -ne '200') {
  $failures.Add("GET /api/monitoring/status expected 200 but received $($monitoring.Status)")
}

$cookieFile = (New-TemporaryFile).FullName
$signInHeadersFile = (New-TemporaryFile).FullName
$signInBodyFile = (New-TemporaryFile).FullName

try {
  Set-Content -LiteralPath $signInBodyFile -NoNewline -Value (ConvertTo-FormBody @{
    email = $AdminEmail
    password = $AdminPassword
    next = '/internal/readiness'
  })

  $signInStatus = & curl.exe -s -o NUL -D $signInHeadersFile -w '%{http_code}' -c $cookieFile -X POST `
    -H 'Content-Type: application/x-www-form-urlencoded' `
    --data-binary "@$signInBodyFile" `
    --max-time 30 `
    "$BaseUrl/api/internal/auth/sign-in"

  $signInHeaders = if (Test-Path -LiteralPath $signInHeadersFile) {
    Get-Content -Raw -LiteralPath $signInHeadersFile
  } else {
    ''
  }
  $signInLocation = Get-HeaderValue -Headers $signInHeaders -Name 'Location'
  $hasInternalSessionCookie = Test-InternalSessionCookie -CookieFile $cookieFile

  $results.Add([PSCustomObject]@{
    Step = 'Internal sign-in'
    Path = '/api/internal/auth/sign-in'
    Status = $signInStatus
    Detail = if ($signInLocation) { $signInLocation } else { 'no-location-header' }
  })

  if ($signInStatus -ne '303') {
    $failures.Add("POST /api/internal/auth/sign-in expected 303 but received $signInStatus")
  } elseif ($signInLocation -match '/internal/sign-in\?error=invalid') {
    $failures.Add('Internal sign-in rejected the configured observability credentials.')
  } elseif (!$hasInternalSessionCookie) {
    $failures.Add('Internal sign-in completed without capturing an internal session cookie.')
  }

  $csrfToken = ''

  if ($failures.Count -eq 0) {
    $csrfToken = Get-CsrfTokenFromHtml -Path '/internal/readiness' -CookieFile $cookieFile

    if (-not $csrfToken) {
      $failures.Add('Unable to extract an internal CSRF token from /internal/readiness after sign-in.')
    } else {
      $results.Add([PSCustomObject]@{
        Step = 'CSRF bootstrap'
        Path = '/internal/readiness'
        Status = '200'
        Detail = 'token captured'
      })
    }
  }

  if ($failures.Count -eq 0) {
    $sentry = Invoke-JsonRequest -Path '/api/internal/sentry/test' -Method 'POST' -CookieFile $cookieFile -CsrfToken $csrfToken
    $sentryDetail = if ($sentry.Json -and $sentry.Json.ok) {
      $sentry.Json.data.result.eventId
    } elseif ($sentry.Json -and !$sentry.Json.ok) {
      $sentry.Json.error.code
    } else {
      'non-json-response'
    }
    $results.Add([PSCustomObject]@{
      Step = 'Sentry verification'
      Path = '/api/internal/sentry/test'
      Status = $sentry.Status
      Detail = $sentryDetail
    })

    if ($sentry.Status -ne '200') {
      $failures.Add("POST /api/internal/sentry/test expected 200 but received $($sentry.Status).")
    }

    $alerts = Invoke-JsonRequest -Path '/api/internal/alerts/test' -Method 'POST' -CookieFile $cookieFile -CsrfToken $csrfToken
    $alertDetail = if ($alerts.Json -and $alerts.Json.ok) {
      $alerts.Json.data.result.statusCode
    } elseif ($alerts.Json -and !$alerts.Json.ok) {
      $alerts.Json.error.code
    } else {
      'non-json-response'
    }
    $results.Add([PSCustomObject]@{
      Step = 'Alert delivery verification'
      Path = '/api/internal/alerts/test'
      Status = $alerts.Status
      Detail = $alertDetail
    })

    if ($alerts.Status -ne '200') {
      $failures.Add("POST /api/internal/alerts/test expected 200 but received $($alerts.Status).")
    }
  }
} finally {
  Remove-Item -LiteralPath $cookieFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $signInHeadersFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $signInBodyFile -Force -ErrorAction SilentlyContinue
}

$results | Format-Table -AutoSize

if ($failures.Count -gt 0) {
  Write-Error ("Observability verification failed:`n" + ($failures -join "`n"))
  exit 1
}

Write-Host "PixloGames observability verification passed for $safeBaseUrl"
