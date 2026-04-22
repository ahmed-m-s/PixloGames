param(
  [string]$BackupDirectory = "backups",

  [switch]$ConfirmRestore,
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

  throw "Required command '$configured' was not found. Set PIXLO_PG_RESTORE_PATH or add PostgreSQL bin tools to PATH."
}

Import-LocalDotEnv

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw "DATABASE_URL must be configured before running a PixloGames PostgreSQL restore."
}

$localMediaRoot = Join-Path (Get-Location) "storage\media"
$pgRestore = Resolve-CommandPath $env:PIXLO_PG_RESTORE_PATH "pg_restore"

Write-Host "Database restore command: $pgRestore"
Write-Host "This restore uses --clean --if-exists against DATABASE_URL."

if ($DryRun) {
  Write-Host "Restore source argument: $BackupDirectory"
  Write-Host "Dry run only. No database or media files were restored."
  exit 0
}

if (!$ConfirmRestore) {
  throw "Restore is destructive. Re-run with -ConfirmRestore after verifying DATABASE_URL targets the intended database."
}

$resolvedBackupDirectory = Resolve-Path -LiteralPath $BackupDirectory
$databaseDump = Join-Path $resolvedBackupDirectory "pixlogames.postgres.dump"
$mediaArchive = Join-Path $resolvedBackupDirectory "local-media.zip"

if (!(Test-Path -LiteralPath $databaseDump)) {
  throw "Expected database dump was not found: $databaseDump"
}

Write-Host "PixloGames restore source: $resolvedBackupDirectory"

& $pgRestore --clean --if-exists --no-owner --no-privileges --dbname $env:DATABASE_URL $databaseDump

if ($LASTEXITCODE -ne 0) {
  throw "pg_restore failed with exit code $LASTEXITCODE."
}

if (Test-Path -LiteralPath $mediaArchive) {
  New-Item -ItemType Directory -Force -Path $localMediaRoot | Out-Null
  Expand-Archive -LiteralPath $mediaArchive -DestinationPath $localMediaRoot -Force
}

Write-Host "Restore complete. Run /api/health and /internal/readiness next."
