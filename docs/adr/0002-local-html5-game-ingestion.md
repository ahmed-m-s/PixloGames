# ADR 0002: Local HTML5 Game Ingestion

## Status

Accepted

## Context

PixloGames supports first-party browser games packaged under `public/games/[slug]` and rendered
through the shared iframe player.

## Decision

Register local games through `createLocalHtml5Game(...)` in `data/games.ts`. The helper owns
standard embed paths, artwork paths, catalog defaults, source metadata, and review notes.

## Consequences

New local games should follow the documented folder contract and use the registry helper instead
of custom one-off metadata.
