# Backup and Restore Rehearsal

This checklist prepares one real PixloGames restore rehearsal. It does not claim a restore was
completed until the steps are run against a disposable database.

## What This Proves

- `pg_dump` can create a PixloGames PostgreSQL backup from the source environment.
- `pg_restore` can restore that backup into a separate disposable database.
- The restored database still satisfies the minimum public catalog shape expected by launch checks.
- The restored database passes read-only DB catalog invariant checks.
- Local media files are included when `local-dev` media storage is active.
- Health and readiness checks still pass after a restored app target is pointed at the restored database.

This does not prove provider point-in-time recovery, provider backups, cross-region recovery, or
production rollback automation. Those remain platform/provider responsibilities.

## Safety Rules

- Never run restore against production or staging unless the restore is intentional.
- Use a disposable restore database with its own `DATABASE_URL`.
- Confirm the backup folder contains `pixlogames.postgres.dump` before restoring.
- Keep staging and production secrets in the host secret manager, not in repo files.
- Do not commit backup dumps, scratch SQL files, logs, or evidence that includes secrets.

## Dry-Run Checks

```powershell
npm run ops:backup:dry-run
npm run ops:restore:dry-run
```

Dry runs prove required commands and environment variables are discoverable. They do not prove a
real backup or restore.

## Rehearsal Sequence

1. Point `$env:DATABASE_URL` at the source database you intend to back up.
2. Run `npm run ops:backup`.
3. Create an empty disposable PostgreSQL database for restore validation.
4. Point `$env:DATABASE_URL` at the disposable restore database.
5. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore-postgres.ps1 -BackupDirectory "backups/pixlogames-YYYYMMDD-HHMMSS" -ConfirmRestore
```

6. Run the DB-level restore verifier:

```powershell
$env:PIXLO_RESTORE_MIN_PUBLIC_GAMES='3'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-restore.ps1
```

7. Start PixloGames against the restored database, preferably in the same hosting mode used for
   staging rehearsal.
8. Run the same verifier with the restored app URL to include public smoke checks:

```powershell
$env:PIXLO_RESTORE_BASE_URL='https://restored-staging.example.com'
$env:PIXLO_RESTORE_MIN_PUBLIC_GAMES='3'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-restore.ps1
```

9. Sign in internally and verify `/internal/readiness` and `/internal/diagnostics`.

## Evidence to Capture

- Source environment and backup folder path.
- Disposable restore database identifier, not the password or full connection string.
- `npm run ops:backup` output, including manifest path.
- `scripts/restore-postgres.ps1 ... -ConfirmRestore` output.
- `scripts/verify-restore.ps1` output, including game, collection, membership, and invariant results.
- Restored app smoke output when `PIXLO_RESTORE_BASE_URL` is available.
- Any warnings, degraded provider states, or manual follow-up decisions.
- Operator, date, commit SHA, and whether the backup was deleted, retained, or moved off-host.

## Success Criteria

- Backup completes with a manifest and PostgreSQL dump.
- Restore completes without `pg_restore` errors.
- `scripts/verify-restore.ps1` reports expected game, public playable game, collection, and membership counts.
- Restore invariant checks report no duplicate slugs or orphaned collection memberships.
- `/api/health` reports database reachable.
- Public game count is at or above the expected staging threshold.
- Internal sign-in succeeds with staging admin credentials.
- If local media is active, restored media assets are readable.

Record the backup folder, restore database name, restore verification output, smoke result, and any
warnings in the release PR.

## Common Failure Modes

- Restoring into staging or production instead of a disposable target.
- Running verification against the source database instead of the restored database.
- Forgetting to run migrations on the disposable target when the backup excludes schema state.
- Treating DB-level verification as enough without running an app smoke check against the restored target.
- Capturing full connection strings or passwords in evidence notes.
