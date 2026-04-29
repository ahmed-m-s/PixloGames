# Third-Party Game Separate-Origin Plan

PixloGames can safely host trusted first-party HTML5 games under the main app origin today. Future
developer-submitted or otherwise untrusted game packages must not use that same-origin path.

This plan defines the smallest practical target model for third-party game package hosting. It is a
plan, not a claim that the infrastructure already exists.

## Current repo reality

The current app has three relevant catalog states:

- `playable_local`: trusted PixloGames-owned HTML5 packages served from `/games/[slug]/index.html`
  on the main app origin.
- `playable_remote`: embedded playable content served from a remote HTTPS origin and sandboxed by
  the shared player.
- `preview`: catalog entries that are listed but do not yet have an approved playable embed.

The current embed guardrails live in:

- `lib/catalog-semantics.ts`
- `lib/embed-security.ts`
- `components/game/game-player.tsx`
- `lib/publishing.ts`

Today, same-origin playable packages are reserved for trusted first-party content only.

## Main app origin policy

Allowed on the main PixloGames app origin:

- the Next.js app
- public routes, catalog data, internal tools, and API routes
- trusted first-party local game packages created by PixloGames and registered through
  `createLocalHtml5Game(...)`
- static first-party game assets under `public/games/[slug]`

Not allowed on the main PixloGames app origin:

- uploaded developer game packages
- publisher-feed game packages that PixloGames does not fully own
- remote packages copied into `public/games`
- any non-first-party embed that needs `allow-same-origin`

The reason is simple: an iframe sandbox using both `allow-scripts` and `allow-same-origin` gives
same-origin game code access to origin-scoped storage and browser trust assumptions. That is
acceptable for PixloGames-owned code, but not for untrusted packages.

## Separate game origin target

Future third-party packages should be served from a dedicated HTTPS game origin, for example:

```text
https://play.pixlogames.example
https://games-cdn.pixlogames.example
```

The exact provider is intentionally not chosen here. The required properties matter more than the
vendor.

The separate origin should be responsible for:

- serving reviewed third-party package files
- keeping third-party cookies, storage, service workers, and caches away from the main app origin
- applying conservative response headers to game package content
- keeping immutable package versions so published games do not change silently
- supporting fast static delivery without access to app secrets, internal routes, or the database

## Minimum isolation properties

The separate game origin should provide:

- HTTPS only
- no app cookies shared with the main PixloGames origin
- no access to internal app routes or app-origin storage
- immutable package paths, such as `/packages/[game-slug]/[version]/index.html`
- no server-side code execution for uploaded packages
- no secret-bearing environment variables
- no directory listing
- upload review before files become publicly addressable
- tight cache rules that allow rollback by switching the catalog embed URL to a previous version

Recommended response headers for third-party package files:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cross-Origin-Resource-Policy: cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

The iframe itself should continue to be sandboxed from the app side. Current repo policy already
omits `allow-same-origin` for non-first-party HTTPS embeds.

## Catalog and runtime mapping

Use current semantics this way:

- first-party local packages: `sourceOrigin = 'first_party'`, `embedType = 'html5-package'`,
  `source.mode = 'embedded'`, local `/games/[slug]/index.html`, catalog kind `playable_local`
- trusted remote playable content: HTTPS `source.url`, `source.mode = 'embedded'`, catalog kind
  `playable_remote`
- unapproved package references: `source.mode = 'preview'`, catalog kind `preview`
- unsupported or unsafe same-origin third-party content: invalid embed policy, not publishable

Do not mark a developer-submitted package as `playable_remote` until the package is hosted on the
separate game origin or another approved HTTPS provider origin.

## Publishing and review gate

Before a third-party package becomes remotely playable:

- submission metadata must be approved
- rights, ad safety, controls, performance, and supported platforms must pass review
- thumbnail and cover assets must exist
- source URL must be HTTPS
- package must not point at the main app origin unless it is a trusted first-party local package
- package version must be immutable
- game page must pass a manual launch check on staging
- all existing repo checks must pass, including catalog integrity, runtime drift, smoke, and
  all-games verification where applicable

Until those are true, keep the catalog entry in preview mode.

## Repo-side vs infrastructure-side

Already repo-side:

- same-origin non-first-party embeds fail closed in `lib/embed-security.ts`
- publishing readiness includes embed security issues from `lib/publishing.ts`
- shared player applies a stricter sandbox for third-party HTTPS embeds
- catalog semantics distinguish playable local, playable remote, preview, and unavailable entries

Still infrastructure-side:

- choosing the game package host or CDN
- provisioning the game origin and TLS
- upload scanning and package unpacking
- immutable object paths and rollback retention
- provider-level cache, header, and access policy
- operational process for removing a published third-party package

## Staged rollout path

1. Keep all developer-submitted package references as preview entries until the separate origin is
   chosen.
2. Provision a staging game origin with no app cookies, no app secrets, and static-only package
   serving.
3. Publish one intentionally low-risk test package to an immutable staging URL.
4. Create an internal draft game that points to that staging HTTPS URL and verify the shared player
   treats it as sandboxed third-party content.
5. Add package review and rollback notes to the operator publishing flow.
6. Only after staging proof, allow production `playable_remote` entries for developer packages.

## Out of scope for now

- choosing a CDN or storage vendor
- implementing upload scanning
- building package unpacking or moderation queues
- adding a cross-origin messaging protocol for third-party games
- granting third-party games app-origin privileges
- moving existing trusted first-party local packages off the main app origin

## Common mistakes to avoid

- copying a developer package into `public/games`
- using `/games/[slug]/index.html` for developer or publisher content
- adding `allow-same-origin` to third-party iframe sandbox policies
- counting preview entries as launch-ready playable games
- treating an HTTPS URL as safe without review, versioning, and rollback
- allowing mutable package URLs where a publisher can change gameplay after approval
- mixing thumbnails/media approval with package execution approval
