# Submission to Publish Runbook

This runbook proves the operator workflow for a real developer submission on staging. It does not
claim that a submission has been processed until an operator runs the steps and captures evidence.

Use this for a moderation-to-publish rehearsal, a beta intake dry run, or the first real developer
submission before promoting it publicly.

## Existing Surfaces

| Stage | Current surface |
| --- | --- |
| Public intake | `/developers/submit-game` and `POST /api/submissions` |
| Review queue | `/internal/submissions` |
| Submission detail and moderation | `/internal/submissions/[id]` |
| Draft creation | `Create game draft` on the submission detail publishing bridge |
| Game operations and publishing | `/internal/games` |
| Post-publish public proof | `/games`, `/search`, `/games/[slug]`, `/api/games`, `/api/health` |

Internal review and publishing actions are protected by internal auth and CSRF. Do not bypass the
internal UI/API protections for a rehearsal.

## Pre-Run Gate

Before processing a real staging candidate, the target deployment should already have:

```powershell
npm run lint
npm run a11y:lint
npm run typecheck
npm run test
npm run build
npm run ops:release:verify
```

If the run will publish a new playable title, also confirm the game source follows the current embed
trust model in `docs/embed-trust-boundary.md` and the future separate-origin plan in
`docs/third-party-game-origin-plan.md`.

## Stage 1: Create or Select a Candidate

Use one of these paths:

- create a staging-only submission through `/developers/submit-game`
- select an existing pending staging submission from `/internal/submissions`

The candidate should include:

- title, short description, full description, category, tags
- developer/publisher name and contact email
- supported platforms
- HTTPS playable source or package/build link
- thumbnail and cover assets through uploads or HTTPS URLs
- accepted terms
- reviewer notes describing expected play behavior

Capture the submission ID, title, source type, playable URL/package reference, asset state, and any
intake warnings. Do not capture secrets or private credentials.

## Stage 2: Intake and Moderation Review

In `/internal/submissions/[id]`:

1. Mark the submission `in_review`.
2. Add a reviewer note describing the test scope.
3. Review metadata, rights, source URL, asset state, duplicate signal, abuse score, and intake
   warnings.
4. Test the submitted playable source outside PixloGames when appropriate.
5. Choose one decision:
   - `needs_changes` when required information, assets, rights, or playable source are not ready
   - `reject` when the game is not eligible for PixloGames
   - `approve` only when the candidate is ready for draft creation

Approval is blocked operationally when any publish-critical issue remains unresolved: missing
required metadata, missing artwork, unsafe or non-HTTPS source, unresolved rights concerns,
unsupported embed mode, or unaccepted terms.

## Stage 3: Create Draft

After approval, use `Create game draft` from the submission detail page.

The draft creation proof should capture:

- generated game slug and game ID
- `sourceSubmissionId`
- `publishingStatus` moving to `draft_created`
- game visibility remaining internal
- any publishing bridge issues that remain

Creating a draft is not public publishing. It proves the approved submission can enter the game
operations workflow.

## Stage 4: Publish Decision

Open `/internal/games` and find the draft by title, slug, or `sourceSubmissionId`.

Before using `Publish`, confirm:

- publishing readiness reports no blocking issues
- moderation status is approved
- QA status is passed
- game source is playable and allowed by the embed trust boundary
- thumbnail and cover render
- mobile support and controls match the submitted game
- ad-safety and sponsored eligibility decisions are correct
- collection/homepage surfacing impact is understood
- rollback note is written before the publish action

If `Publish` is disabled or the API reports `game_not_publishable`, treat that as a blocker. Do not
force public visibility through lower-level admin routes.

## Stage 5: Post-Publish Verification

After publishing, verify the public runtime path:

1. Confirm `/internal/games` shows the game as `published` and `public`.
2. Confirm the linked submission shows `publishingStatus=published`.
3. Open `/api/games` and confirm the slug appears.
4. Open `/games` and confirm the game is discoverable where expected.
5. Search by title or a unique tag and confirm the result appears.
6. Open `/games/[slug]`, tap Play, and confirm the iframe/player loads.
7. Exercise one minimal gameplay input path.
8. Run `npm run ops:release:verify` against staging.
9. If the game is intended to become permanent catalog content, resolve the static registry/collection
   decision before treating runtime catalog drift checks as launch-clean.

If the title is only a runtime staging rehearsal, record that it is not a permanent catalog addition
and remove or unpublish it before the next release candidate as appropriate.

## Rollback and Recovery Notes

Before publishing, write the rollback note:

- game ID and slug
- submission ID
- exact reason the game can be unpublished
- expected post-rollback state
- who owns developer communication

If publish verification fails, use `Unpublish` from `/internal/games`, then verify:

- game status returns to draft/internal
- submission `publishingStatus` returns to `draft_created`
- `/api/games`, `/games`, and search no longer expose the game publicly
- the failure and rollback evidence are captured

## Evidence to Capture

Capture:

- staging URL and commit SHA
- operator and date
- submission ID, game ID, generated slug
- screenshots or exported notes from review status, draft creation, and publish state
- publish readiness issues before and after resolution
- post-publish public route/search/detail/player proof
- `npm run ops:release:verify` result
- rollback note, or explicit statement that rollback was not needed
- warnings accepted by the operator

Never capture internal passwords, session cookies, CSRF tokens, provider credentials, or full private
source URLs when they are not meant for the release record.

## Blockers vs Warnings

Block publish when:

- terms are not accepted
- source URL is not HTTPS or violates the embed trust boundary
- rights, originality, or developer ownership are unresolved
- thumbnail or cover is missing
- moderation is not approved
- QA is not passed
- publishing readiness has any error
- Play does not load a usable iframe/player
- the game cannot be discovered after publish
- rollback steps are unknown

Record as warning when:

- tags or copy need editorial polish but the game remains understandable
- collection/homepage placement is deferred
- a provider state is degraded but explicitly accepted for staging
- deeper per-game accessibility or device testing remains scheduled before public expansion

## Scope Limits

This runbook does not automate the full publishing flow, certify a third-party package as safe, or
replace legal/content review. It proves an operator can run the current PixloGames submission,
review, draft, publish, verify, and rollback path with clear evidence and decision points.
