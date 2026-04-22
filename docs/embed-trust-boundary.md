# Game Embed Trust Boundary

PixloGames currently hosts trusted first-party HTML5 games under `public/games/[slug]` and renders them through the shared iframe player. Those packages are treated as trusted PixloGames code.

## Current Policy

- Trusted first-party local packages may use `/games/[slug]/index.html`.
- First-party local packages receive `allow-scripts allow-same-origin allow-pointer-lock` so existing games can use browser storage and run normally.
- Developer submissions, publisher feeds, and other non-first-party embeds must use HTTPS remote URLs.
- Non-first-party embeds are sandboxed without `allow-same-origin` and without `allow-forms`.
- Same-origin non-first-party embeds fail validation and should not be published.

## Why Same-Origin Third-Party Packages Are Not Safe

Sandboxing an iframe with both `allow-scripts` and `allow-same-origin` gives same-origin game code too much access for untrusted content. It can interact with origin-scoped storage and platform assumptions in ways that are acceptable for PixloGames-owned games but unsafe for uploaded third-party packages.

## Future Infrastructure Needed

To support untrusted HTML5 packages properly, host them on a separate games origin or CDN domain such as `play.pixlogames.example`. That origin should have its own cookies/storage boundary, strict upload validation, and conservative response headers. Repo code now fails closed for same-origin non-first-party embeds, but infrastructure isolation is the real long-term boundary.
