# CI and Release Governance

PixloGames uses one primary GitHub Actions quality gate for pull requests and pushes to the default branch. Keep this workflow boring, strict, and high signal.

## Required PR Gate

Before merge, the `Quality Gates` job should be green. It verifies:

- dependency installation with `npm ci`
- Prisma client generation, migrations, and catalog seed against CI PostgreSQL
- Conventional Commit messages on pull requests
- security audit at the configured high-severity threshold
- formatting, lint, accessibility lint, and typecheck
- Vitest coverage, including catalog integrity checks
- production build
- performance budget
- Playwright public journey smoke tests
- Playwright runtime accessibility smoke tests

## Branch Protection

Repository files cannot enforce GitHub branch protection by themselves. In GitHub settings, require:

- pull requests before merging to `main`
- `Quality Gates` as a required status check. This is the stable job name from `.github/workflows/ci.yml`.
- branches to be up to date before merging when multiple people are contributing
- stale review dismissal after new commits, if the team uses reviews
- linear history or squash merge, if the team wants a tidy release trail
- administrator enforcement once the project moves beyond solo development

Do not mark individual workflow steps as required checks. Require the single `Quality Gates` job so
future step-level changes do not break branch protection settings.

## Promotion Path

Use this lightweight release path:

1. Open a pull request with the PR template filled in.
2. Wait for `Quality Gates` to pass.
3. Review any migration, environment, deployment, staging verification, or rollback notes.
4. Merge to the default branch.
5. Deploy from the green default-branch commit to staging first.
6. Run `npm run ops:release:verify` against staging.
7. Promote only after staging verification has a clear pass or an explicitly accepted warning.

## Failure Diagnostics

On CI failure, GitHub uploads short-lived diagnostic artifacts when present:

- `coverage`
- `playwright-report`
- `test-results`

Use these to inspect browser smoke, runtime accessibility, and coverage failures without rerunning locally first.
