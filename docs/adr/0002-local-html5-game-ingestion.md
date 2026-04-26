# ADR 0002: Local HTML5 Game Ingestion

## Status

Accepted

## Context

PixloGames supports first-party browser games packaged under `public/games/[slug]` and rendered
through the shared iframe player. Static packages can shadow App Router routes when the clean URL
matches a game detail route, so local packages may use `public/playable-games/[slug]` when needed.

## Decision

Register local games through `createLocalHtml5Game(...)` in `data/games.ts`. The helper owns
standard embed paths, artwork paths, catalog defaults, source metadata, and review notes. By
default it uses `public/games/[slug]`; pass `assetBasePath: '/playable-games'` for packages that
must not overlap an app route.

## Consequences

New local games should follow the documented folder contract and use the registry helper instead
of custom one-off metadata.
