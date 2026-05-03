# Local HTML5 Game Packages

PixloGames local packages use this folder contract:

```text
public/games/[slug]/
  index.html
  style.css
  game.js
  assets/
    thumbnail.svg
    cover.svg
```

Register the game in `data/games.ts` with `createLocalHtml5Game(...)`.
The helper assigns the standard embed path, artwork paths, source metadata, publication defaults, and QA-ready catalog fields.
DB-backed environments read the runtime catalog from seeded Prisma data, so run `npm run db:seed` after adding or updating a local package registration before deployment or release verification.

Platform embeds append `?autostart=1`. Local games can use that flag to skip their large intro screen and add the `is-embedded-autostart` class.
The shared player also posts `{ type: "pixlo:fullscreen-state", isFullscreen }` into the iframe so games can switch to a no-scroll fullscreen layout.

For the full add-a-game workflow, use [`docs/new-game-package-checklist.md`](../../docs/new-game-package-checklist.md).
