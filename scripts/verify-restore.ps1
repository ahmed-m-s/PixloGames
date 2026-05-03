param(
  [string]$BaseUrl = $env:PIXLO_RESTORE_BASE_URL,
  [int]$MinPublicGames = $(
    if ($env:PIXLO_RESTORE_MIN_PUBLIC_GAMES) {
      [int]$env:PIXLO_RESTORE_MIN_PUBLIC_GAMES
    } elseif ($env:PIXLO_SMOKE_MIN_PUBLIC_GAMES) {
      [int]$env:PIXLO_SMOKE_MIN_PUBLIC_GAMES
    } elseif ($env:PIXLO_EXPECTED_PUBLIC_GAME_COUNT) {
      [int]$env:PIXLO_EXPECTED_PUBLIC_GAME_COUNT
    } else {
      1
    }
  ),
  [Alias("SkipRuntimeDriftTest")]
  [switch]$SkipInvariantChecks,
  [switch]$SkipSmoke
)

$ErrorActionPreference = "Stop"

function Import-LocalDotEnv {
  $envPath = Join-Path (Get-Location) ".env"

  if (!(Test-Path -LiteralPath $envPath)) {
    return
  }

  Get-Content -LiteralPath $envPath | ForEach-Object {
    $line = $_.Trim()

    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) {
      return
    }

    $name, $value = $line.Split("=", 2)
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")

    if ($name -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name, "Process"))) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Resolve-CommandPath([string]$configured, [string]$fallbackName) {
  if ([string]::IsNullOrWhiteSpace($configured)) {
    $configured = $fallbackName
  }

  if (Test-Path -LiteralPath $configured) {
    return (Resolve-Path -LiteralPath $configured).Path
  }

  $command = Get-Command $configured -ErrorAction SilentlyContinue

  if ($command) {
    return $command.Source
  }

  $windowsPostgresTool = Get-ChildItem -LiteralPath "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName "bin\$fallbackName.exe" } |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

  if ($windowsPostgresTool) {
    return $windowsPostgresTool
  }

  throw "Required command '$configured' was not found. Set PIXLO_PSQL_PATH or add PostgreSQL bin tools to PATH."
}

function Resolve-PostgresToolDatabaseUrl([string]$databaseUrl) {
  try {
    $builder = [System.UriBuilder]::new($databaseUrl)
    $query = $builder.Query.TrimStart("?")

    if ($query) {
      $keptQueryParts = $query.Split("&") | Where-Object {
        $name = $_.Split("=", 2)[0]

        $name -ine "schema"
      }

      $builder.Query = ($keptQueryParts -join "&")
    }

    return $builder.Uri.AbsoluteUri
  } catch {
    return ($databaseUrl -replace "([?&])schema=[^&]*&?", '$1').TrimEnd("?", "&")
  }
}

function Invoke-ScalarSql {
  param(
    [string]$Psql,
    [string]$DatabaseUrl,
    [string]$Sql
  )

  $queryFile = New-TemporaryFile

  try {
    Set-Content -LiteralPath $queryFile.FullName -Value $Sql
    $output = & $Psql --dbname=$DatabaseUrl --no-align --tuples-only --quiet --set ON_ERROR_STOP=1 --file $queryFile.FullName

    if ($LASTEXITCODE -ne 0) {
      throw "psql restore verification query failed with exit code $LASTEXITCODE."
    }

    $value = $output | Where-Object { $_ -match "\S" } | Select-Object -Last 1

    if ([string]::IsNullOrWhiteSpace($value)) {
      throw "psql restore verification query returned no value: $Sql"
    }

    return [int]$value.Trim()
  } finally {
    Remove-Item -LiteralPath $queryFile.FullName -Force -ErrorAction SilentlyContinue
  }
}

function Assert-Minimum {
  param(
    [string]$Label,
    [int]$Actual,
    [int]$Minimum
  )

  if ($Actual -lt $Minimum) {
    throw "$Label expected at least $Minimum but received $Actual."
  }
}

Import-LocalDotEnv

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw "DATABASE_URL must point at the restored database before running restore verification."
}

$psql = Resolve-CommandPath $env:PIXLO_PSQL_PATH "psql"
$postgresToolDatabaseUrl = Resolve-PostgresToolDatabaseUrl $env:DATABASE_URL

Write-Host "PixloGames restore verification target: DATABASE_URL"
Write-Host "Post-restore SQL command: $psql"

$totalGames = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from public."Game";'
$publicGames = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql "select count(*) from public.""Game"" where ""visibility"" = 'public';"
$publicPlayableGames = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql "select count(*) from public.""Game"" where ""visibility"" = 'public' and ""hasRealEmbed"" = true;"
$collections = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from public."Collection";'
$memberships = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from public."GameCollectionMembership";'
$internalUsers = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from public."InternalUser" where "active" = true;'
$duplicateGameSlugs = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from (select "slug" from public."Game" group by "slug" having count(*) > 1) duplicates;'
$duplicateCollectionSlugs = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from (select "slug" from public."Collection" group by "slug" having count(*) > 1) duplicates;'
$orphanedMemberships = Invoke-ScalarSql -Psql $psql -DatabaseUrl $postgresToolDatabaseUrl -Sql 'select count(*) from public."GameCollectionMembership" m left join public."Game" g on g."id" = m."gameId" left join public."Collection" c on c."id" = m."collectionId" where g."id" is null or c."id" is null;'

Assert-Minimum -Label "Total games" -Actual $totalGames -Minimum 1
Assert-Minimum -Label "Public games" -Actual $publicGames -Minimum $MinPublicGames
Assert-Minimum -Label "Public playable games" -Actual $publicPlayableGames -Minimum $MinPublicGames
Assert-Minimum -Label "Collections" -Actual $collections -Minimum 1
Assert-Minimum -Label "Collection memberships" -Actual $memberships -Minimum 1

if (!$SkipInvariantChecks) {
  if ($duplicateGameSlugs -ne 0) {
    throw "Game slug uniqueness drift detected: $duplicateGameSlugs duplicate slug group(s)."
  }

  if ($duplicateCollectionSlugs -ne 0) {
    throw "Collection slug uniqueness drift detected: $duplicateCollectionSlugs duplicate slug group(s)."
  }

  if ($orphanedMemberships -ne 0) {
    throw "Collection membership drift detected: $orphanedMemberships orphaned membership row(s)."
  }
}

[PSCustomObject]@{
  TotalGames = $totalGames
  PublicGames = $publicGames
  PublicPlayableGames = $publicPlayableGames
  Collections = $collections
  CollectionMemberships = $memberships
  ActiveInternalUsers = $internalUsers
  MinimumPublicGames = $MinPublicGames
  DuplicateGameSlugGroups = $duplicateGameSlugs
  DuplicateCollectionSlugGroups = $duplicateCollectionSlugs
  OrphanedCollectionMemberships = $orphanedMemberships
} | Format-List

if ($SkipInvariantChecks) {
  Write-Host "Skipped restore invariant checks by operator request."
} else {
  Write-Host "Restore invariant checks passed."
}

if ($BaseUrl -and !$SkipSmoke) {
  $smokeScript = Join-Path $PSScriptRoot "deployment-smoke.ps1"
  Write-Host "Running restored app smoke checks against $BaseUrl..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File $smokeScript -BaseUrl $BaseUrl -AllowDegraded

  if ($LASTEXITCODE -ne 0) {
    throw "Restored app smoke verification failed with exit code $LASTEXITCODE."
  }
} elseif (!$BaseUrl -and !$SkipSmoke) {
  Write-Host "Skipping restored app smoke checks. Set PIXLO_RESTORE_BASE_URL to verify a running app against this restored database."
}

Write-Host "PixloGames restore verification passed."
