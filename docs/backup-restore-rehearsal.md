# Backup and Restore Rehearsal

This checklist prepares one real PixloGames restore rehearsal. It does not claim a restore was
completed until the steps are run against a disposable database.

## What This Proves

- `pg_dump` can create a PixloGames PostgreSQL backup from the source environment.
- `pg_restore` can restore that backup into a separate disposable database.
- Local media files are included when `local-dev` media storage is active.
- Health and readiness checks still pass after the restored database is used.

## Safety Rules

- Never run restore against production or staging unless the restore is intentional.
- Use a disposable restore database with its own `DATABASE_URL`.
- Confirm the backup folder contains `pixlogames.postgres.dump` before restoring.
- Keep staging and production secrets in the host secret manager, not in repo files.

## Dry-Run Checks

```powershell
npm run ops:backup:dry-run
npm run ops:restore:dry-run
```

Dry runs prove required commands and environment variables are discoverable. They do not prove a
real backup or restore.

## Rehearsal Sequence

1. Point `DATABASE_URL` at the staging source database.
2. Run `npm run ops:backup`.
3. Create an empty disposable PostgreSQL database for restore validation.
4. Point `DATABASE_URL` at the disposable restore database.
5. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore-postgres.ps1 -BackupDirectory "backups/pixlogames-YYYYMMDD-HHMMSS" -ConfirmRestore
```

6. Start PixloGames against the restored database.
7. Run `npm run ops:smoke` with `PIXLO_SMOKE_BASE_URL` pointing at that restored app target.
8. Sign in internally and verify `/internal/readiness` and `/internal/diagnostics`.

## Success Criteria

- Backup completes with a manifest and PostgreSQL dump.
- Restore completes without `pg_restore` errors.
- `/api/health` reports database reachable.
- Public game count is at or above the expected staging threshold.
- Internal sign-in succeeds with staging admin credentials.
- If local media is active, restored media assets are readable.

Record the backup folder, restore database name, smoke result, and any warnings in the release PR.
