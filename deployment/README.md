# PixloGames Deployment Notes

These notes prepare PixloGames for a real host without pretending any host is already configured.

## Runtime Expectations

- Node.js 22 or a compatible managed Node runtime.
- PostgreSQL reachable through `DATABASE_URL`.
- `npm ci`, `npm run build`, `npm run db:deploy`, then `npm run start`.
- `NEXT_PUBLIC_SITE_URL` must be the public HTTPS origin for the target environment.
- `PIXLO_CSRF_SECRET` must be a long random secret for hosted beta and production.
- Internal pages and internal mutation APIs must remain behind PixloGames internal auth.

## Target Options

- VPS/self-hosted Node: use a process manager such as PM2, a reverse proxy, TLS, firewall rules, and backup scheduling.
- Managed Node host: configure env vars in the provider dashboard and run `npm run build` followed by `npm run start`.
- Containerized deployment: use the root `Dockerfile` as a starting point and inject secrets at runtime.
- Platform deployment: use provider-managed build, runtime env vars, managed PostgreSQL, and object storage for media.

## Reverse Proxy, Domain, and TLS

- Terminate TLS before traffic reaches Next.js.
- Forward requests to the Node process on `PORT`, default `3000`.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.
- Keep `/api/health` and `/api/monitoring/status` reachable for uptime checks.
- Do not rely on local filesystem media storage in production unless backups and durable disk are deliberate.

## Deployment Sequence

1. Install dependencies with `npm ci`.
2. Generate Prisma client with `npm run db:generate` if your host does not run it during build.
3. Apply migrations with `npm run db:deploy`.
4. Build with `npm run build`.
5. Start with `npm run start`.
6. Run `npm run ops:smoke` with `PIXLO_SMOKE_BASE_URL` set to the deployed URL.
7. Run `npm run ops:release:verify` with expected environment and rollout env vars set for staging or production.
8. Sign in internally and verify `/internal/readiness` and `/internal/diagnostics`.
9. Confirm protected internal mutations reject requests without a CSRF token and work from the internal UI.

## Staging Readiness

Use `.env.staging.example` as the required staging configuration checklist. A staging deployment is
considered repo-ready only when:

- it runs with `PIXLO_ENVIRONMENT_MODE=staging`
- it uses an HTTPS `NEXT_PUBLIC_SITE_URL`
- PostgreSQL migrations and seed have run against the staging database
- internal admin credentials and `PIXLO_CSRF_SECRET` are configured through the host secret manager
- `npm run ops:release:verify` passes with `PIXLO_SMOKE_REQUIRE_AUTHENTICATED=1`
- any degraded provider state is documented before promotion

## Release Gate

- Deploy only from a commit that passed the GitHub Actions `Quality Gates` workflow.
- Treat `docs/ci-release-governance.md` as the merge and promotion checklist.
- Treat `docs/release-verification.md` as the post-deploy verification checklist.
- If a deployment includes migrations or environment changes, capture the rollback note in the pull request before merge.

## Rollback Basics

- Keep the previous app artifact available.
- Keep a current database backup and verify restore against a disposable database.
- If launch behavior looks risky, remove `PIXLO_PUBLIC_LAUNCH_ENABLED` and keep rollout stage below `production`.
- Confirm media assets remain readable before and after rollback.

Use `docs/backup-restore-rehearsal.md` before the first beta release to prove the backup and restore
path without touching production or staging data destructively.
