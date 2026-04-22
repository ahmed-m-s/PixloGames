# ADR 0001: Repository Quality Gates

## Status

Accepted

## Context

PixloGames already has a production-oriented Next.js and PostgreSQL foundation, but the repository
needed automated checks for regressions, security, and maintainability.

## Decision

Use GitHub Actions as the baseline quality gate. The CI workflow installs with `npm ci`, runs
security audit, lint, accessibility lint, typecheck, coverage tests, build, and a static JS
performance budget check.

## Consequences

Every future production change should keep these gates green. Coverage thresholds start on the
newly tested core logic and should be raised as the automated test suite expands.
