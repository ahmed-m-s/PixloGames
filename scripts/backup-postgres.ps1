param(
  [switch]$DryRun
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

  throw "Required command '$configured' was not found. Set PIXLO_PG_DUMP_PATH or add PostgreSQL bin tools to PATH."
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

Import-LocalDotEnv

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw "DATABASE_URL must be configured before running a PixloGames PostgreSQL backup."
}

$backupRoot = if ([string]::IsNullOrWhiteSpace($env:PIXLO_BACKUP_DIRECTORY)) {
  Join-Path (Get-Location) "backups"
} elseif ([System.IO.Path]::IsPathRooted($env:PIXLO_BACKUP_DIRECTORY)) {
  $env:PIXLO_BACKUP_DIRECTORY
} else {
  Join-Path (Get-Location) $env:PIXLO_BACKUP_DIRECTORY
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$targetDir = Join-Path $backupRoot "pixlogames-$timestamp"
$databaseDump = Join-Path $targetDir "pixlogames.postgres.dump"
$manifestPath = Join-Path $targetDir "manifest.txt"
$localMediaRoot = Join-Path (Get-Location) "storage\media"
$mediaArchive = Join-Path $targetDir "local-media.zip"
$pgDump = Resolve-CommandPath $env:PIXLO_PG_DUMP_PATH "pg_dump"
$postgresToolDatabaseUrl = Resolve-PostgresToolDatabaseUrl $env:DATABASE_URL

Write-Host "PixloGames backup target: $targetDir"
Write-Host "Database dump command: $pgDump"

if ($DryRun) {
  Write-Host "Dry run only. No backup files were created."
  exit 0
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

& $pgDump --format=custom --no-owner --no-privileges --file $databaseDump $postgresToolDatabaseUrl

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE."
}

if ((Test-Path -LiteralPath $localMediaRoot) -and (Get-ChildItem -LiteralPath $localMediaRoot -Force -ErrorAction SilentlyContinue)) {
  Compress-Archive -Path (Join-Path $localMediaRoot "*") -DestinationPath $mediaArchive -Force
}

@(
  "PixloGames backup manifest"
  "createdAt=$(Get-Date -AsUTC -Format o)"
  "databaseDump=$databaseDump"
  "localMediaArchive=$mediaArchive"
  "scope=PostgreSQL database plus local media files when present"
  "note=This is a local/helper backup scaffold. Production should store copies off-host."
) | Set-Content -LiteralPath $manifestPath

Write-Host "Backup complete: $targetDir"
