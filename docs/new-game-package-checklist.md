# New First-Party Local Game Package Checklist

Use this checklist when adding a trusted first-party HTML5 game under `public/games/[slug]` or,
when the package would shadow an app route, `public/playable-games/[slug]`. This is not for
developer submissions or third-party packages.

The goal is simple: ship a new game without breaking discovery, artwork, runtime seed state, or the
shared player contract.

## 1. Add the local package files

Required folder contract:

```text
public/games/[slug]/
public/playable-games/[slug]/
  index.html
  style.css
  game.js
  assets/
    thumbnail.svg
    cover.svg
```

Checklist:

- [ ] The folder name matches the final slug exactly.
- [ ] `index.html`, `style.css`, and `game.js` are present.
- [ ] `assets/thumbnail.svg` and `assets/cover.svg` are present and final.
- [ ] The package works from the helper-derived embed path without extra routing or server logic.

## 2. Follow the shared player contract

Current local packages are loaded through the shared iframe player. New packages should match that
contract instead of creating a one-off embed path.

Checklist:

- [ ] Support `?autostart=1` so the shared player can launch the game directly from `Play now`.
- [ ] Add the `is-embedded-autostart` class when autostart is active, following the current package pattern in [`public/games/README.md`](../public/games/README.md).
- [ ] Handle the `pixlo:fullscreen-state` postMessage so fullscreen can switch the game into a clean no-scroll layout.
- [ ] Keep the game desktop-playable even if it is also touch-friendly.
- [ ] Make the declared controls and orientation true in practice.

Recommended because it keeps verification stable:

- [ ] Keep a start overlay like `#startScreen`.
- [ ] Keep a stable play surface such as `#board`, `#gameCanvas`, or `#tubeBoard`.
- [ ] If the game needs custom interaction verification, add the smallest per-game override to [`tests/e2e/playable-games-verification.spec.ts`](../tests/e2e/playable-games-verification.spec.ts).

## 3. Register the game through the ingestion helper

Register new first-party local games with `createLocalHtml5Game(...)` in [`data/games.ts`](../data/games.ts).
Do not hand-roll a parallel metadata shape for a normal local package.

Checklist:

- [ ] Add one `createLocalHtml5Game({ ... })` entry in [`data/games.ts`](../data/games.ts).
- [ ] Fill in real values for title, descriptions, category, tags, controls, instructions, release date, and discovery flags.
- [ ] Set `orientation`, `mobileSupported`, and `fullscreenSupported` honestly.
- [ ] Use the final slug before merging. The helper derives the game ID, embed path, and local artwork paths from it.
- [ ] Set `assetBasePath: '/playable-games'` only when a static package under `/games/[slug]` would shadow the app route for that game.

## 4. Make discovery intentional

Adding a direct route is not enough. The game should surface through the catalog on purpose.

Checklist:

- [ ] Add the game to the right collection IDs in the game entry.
- [ ] Add the matching game ID to the collection memberships in [`data/collections.ts`](../data/collections.ts).
- [ ] Keep both sides aligned. PixloGames integrity checks expect the registry entry and collection membership list to agree.
- [ ] Only add the game to homepage-facing collections when it genuinely belongs there.

## 5. Run the mandatory local checks before merge

Run these before treating the game as ready:

```powershell
npm run lint
npm run a11y:lint
npm run typecheck
npm run test
npm run build
npm run test:smoke
npm run test:smoke:mobile
npm run test:verify:games
npm run db:seed
npm run test:catalog:runtime
```

Why these matter:

- `npm run test` includes catalog integrity checks, so missing files, missing artwork, and registry or collection drift should fail fast.
- `npm run test:smoke` and `npm run test:smoke:mobile` prove the public journey still works.
- `npm run test:verify:games` covers every playable first-party local game and will automatically include new packages under `public/games` or `public/playable-games`.
- `npm run db:seed` then `npm run test:catalog:runtime` proves the DB-backed runtime catalog still matches the seeded registry and collection state.

## 6. Verify the game on staging before calling it ready

After the branch is green and staging is deployed:

- [ ] Run `npm run ops:release:verify` against staging.
- [ ] Run the all-games staging verification with the staging base URL:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://your-staging-host'
npm run test:verify:games
```

- [ ] Open `/games/[slug]` on staging and confirm the actual game detail page, `Play now`, iframe load, and fullscreen control all behave correctly.

## 7. Ready vs. not ready

Treat the game as ready only when all of these are true:

- [ ] required package files and artwork exist
- [ ] the game is registered through `createLocalHtml5Game(...)`
- [ ] collection membership is intentional and aligned on both sides
- [ ] local checks pass
- [ ] DB seed + runtime catalog drift check pass
- [ ] staging verification passes

The game is not ready if any of these are true:

- [ ] it only works by direct URL but is not discoverable on purpose
- [ ] artwork or package files are missing
- [ ] the game ignores autostart or breaks in fullscreen
- [ ] metadata says mobile-friendly or landscape-only but the package behaves differently
- [ ] registry and collection entries disagree
- [ ] runtime drift appears until someone manually fixes seed state

## 8. Common failure modes to avoid

- Missing `assets/thumbnail.svg` or `assets/cover.svg`
- Adding the slug under `public/games` or `public/playable-games` but forgetting the `createLocalHtml5Game(...)` entry
- Updating `collectionIds` in the game entry without updating [`data/collections.ts`](../data/collections.ts), or the reverse
- Shipping a package that only starts from its own intro UI and does not honor `?autostart=1`
- Marking a game touch-friendly without real touch input support
- Skipping `npm run db:seed` before the runtime catalog drift check
- Replacing the standard package structure or embed path with a custom one-off pattern

## 9. Source files this checklist relies on

- [`public/games/README.md`](../public/games/README.md)
- [`data/games.ts`](../data/games.ts)
- [`data/collections.ts`](../data/collections.ts)
- [`lib/game-ingestion.ts`](../lib/game-ingestion.ts)
- [`components/game/game-player.tsx`](../components/game/game-player.tsx)
- [`tests/catalog-integrity.test.ts`](../tests/catalog-integrity.test.ts)
- [`tests/runtime-catalog-drift.test.ts`](../tests/runtime-catalog-drift.test.ts)
- [`tests/e2e/public-game-journey.spec.ts`](../tests/e2e/public-game-journey.spec.ts)
- [`tests/e2e/playable-games-verification.spec.ts`](../tests/e2e/playable-games-verification.spec.ts)
- [`docs/adr/0002-local-html5-game-ingestion.md`](./adr/0002-local-html5-game-ingestion.md)
