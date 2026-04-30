# Release Verification

PixloGames has repo-level quality gates, but a hosted release is only proven after the deployed target answers health and readiness checks.

## Pre-Deploy Gate

Deploy only from a commit that passed GitHub Actions `Quality Gates`. Locally, use the same core checks when preparing a manual release:

```powershell
npm run lint
npm run a11y:lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:smoke
npm run test:a11y
npm run build
```

## Staging Verification

Use `.env.staging.example` as the staging environment checklist. After deploying staging, run:

```powershell
$env:PIXLO_SMOKE_BASE_URL='https://staging.games.example.com'
$env:PIXLO_SMOKE_EXPECTED_ENVIRONMENT_MODE='staging'
$env:PIXLO_SMOKE_EXPECTED_ROLLOUT_STAGE='private_beta'
$env:PIXLO_SMOKE_EXPECTED_HOSTING_TARGET='platform'
$env:PIXLO_SMOKE_EXPECTED_DEPLOYMENT_TARGET='cloud'
$env:PIXLO_SMOKE_MIN_PUBLIC_GAMES='3'
$env:PIXLO_SMOKE_REQUIRE_AUTHENTICATED='1'
$env:PIXLO_SMOKE_REQUIRE_CONTROLLED_BETA_READY='1'
$env:PIXLO_SMOKE_ADMIN_EMAIL='ops@example.com'
$env:PIXLO_SMOKE_ADMIN_PASSWORD='<staging-admin-password>'
npm run ops:release:verify
```

This checks public routes, health, monitoring, deployment mode, rollout stage, public game count, protected redirects, and authenticated internal readiness when credentials are provided.

If staging is intentionally incomplete, set `PIXLO_SMOKE_ALLOW_DEGRADED=1` only with a written note
explaining each warning. A degraded staging run is readiness evidence, not a launch pass.

## Observability Verification

After the core staging release check passes, verify observability on the same deployment:

```powershell
$env:PIXLO_OBSERVABILITY_BASE_URL='https://staging.games.example.com'
$env:PIXLO_OBSERVABILITY_ADMIN_EMAIL='ops@example.com'
$env:PIXLO_OBSERVABILITY_ADMIN_PASSWORD='<staging-admin-password>'
npm run ops:observability:verify
```

Staging observability should be treated as active only when these values are configured in the
hosting provider secret manager:

- `SENTRY_DSN` for server-side event capture
- `NEXT_PUBLIC_SENTRY_DSN` for client-side event capture
- `NEXT_PUBLIC_PIXLO_ENVIRONMENT_MODE=staging` so browser events are labeled clearly
- `PIXLO_MONITORING_WEBHOOK_URL` and, if used, `PIXLO_MONITORING_WEBHOOK_SECRET`

The verifier signs into the protected internal surface, captures a CSRF token from
`/internal/readiness`, posts a controlled Sentry verification event through
`/api/internal/sentry/test`, and posts a controlled alert delivery through
`/api/internal/alerts/test`.

Treat the run as complete only after:

- the script returns `200` for both protected test routes
- the returned Sentry event ID is visible in the staging Sentry project
- the alert receiver shows the `PixloGames alert test` message

## Production Verification

For production go-live, add:

```powershell
$env:PIXLO_SMOKE_EXPECTED_ENVIRONMENT_MODE='production'
$env:PIXLO_SMOKE_EXPECTED_ROLLOUT_STAGE='production'
$env:PIXLO_SMOKE_REQUIRE_PRODUCTION_READY='1'
$env:PIXLO_SMOKE_MIN_PUBLIC_GAMES='12'
npm run ops:release:verify
```

Only set `PIXLO_SMOKE_ALLOW_DEGRADED=1` when the release is intentionally in a staging watch state and the warnings are understood.

## Rollback Check

Before expanding rollout, confirm:

- the previous app artifact can be redeployed
- a recent database backup exists
- restore has been rehearsed against a disposable database
- media storage remains readable after rollback
- `/api/health`, `/api/monitoring/status`, `/internal/readiness`, and `/internal/diagnostics` are checked after rollback

Use `docs/backup-restore-rehearsal.md` for the exact rehearsal sequence and success criteria.
