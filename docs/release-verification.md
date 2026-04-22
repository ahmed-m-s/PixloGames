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
$env:PIXLO_SMOKE_ADMIN_PASSWORD='use-the-staging-secret'
npm run ops:release:verify
```

This checks public routes, health, monitoring, deployment mode, rollout stage, public game count, protected redirects, and authenticated internal readiness when credentials are provided.

If staging is intentionally incomplete, set `PIXLO_SMOKE_ALLOW_DEGRADED=1` only with a written note
explaining each warning. A degraded staging run is readiness evidence, not a launch pass.

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
