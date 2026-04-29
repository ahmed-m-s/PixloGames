# Manual Accessibility Review

PixloGames already runs accessibility linting and Playwright axe smoke checks. This checklist is the
manual review layer for behavior that automation cannot prove well: keyboard flow, visible focus,
screen-reader sanity, and iframe/player recovery.

Do not describe a release as manually accessibility-reviewed until this checklist has been run
against the staging URL and the evidence has been captured. This is not WCAG certification.

## Pre-Run Gate

Run the automated checks first:

```powershell
npm run a11y:lint
npm run test:a11y
npm run test:smoke
npm run test:smoke:mobile
```

If one of these fails, fix the automated blocker before manual review. Manual review is for issues
automation misses, not a substitute for failed checks.

## Routes and Flows

Review these routes on the staging deployment:

| Route/flow | What to cover |
| --- | --- |
| `/` | Header, primary navigation, search, homepage discovery sections. |
| `/games` | Browse heading, filters/links if present, game-card navigation, scroll behavior. |
| `/search?q=memory` | Search results heading, result cards, empty/new search behavior. |
| `/games/endless-runner` | Game detail content, Play, Fullscreen, iframe focus, player recovery. |
| `/internal/sign-in` | Email/password labels, error message, sign-in button, signed-out message if reachable. |

If a release changes a specific game package, also review that game detail page and one game input
path after launch.

## Keyboard-Only Checks

Use only keyboard input. Do not use the mouse or touch during this pass.

1. Start at the browser address bar, load the route, then use `Tab` and `Shift+Tab`.
2. Confirm focus is visible on every interactive element.
3. Confirm tab order follows the visible page order: header, search/navigation, main content,
   player controls, then lower page content.
4. Confirm `Enter` activates links, search submission, game cards, and the primary Play action.
5. Confirm `Space` activates buttons where expected.
6. On `/games/endless-runner`, activate Play, confirm focus can reach the iframe, and confirm the
   user can continue tabbing back to page controls.
7. Activate Fullscreen when available. Confirm `Esc` exits or the unavailable-fullscreen message is
   visible and the player remains usable.
8. Confirm no route traps focus, hides the currently focused element, or strands the user inside the
   iframe/player.

## Screen-Reader Sanity Checks

Use one current screen reader/browser pairing available to the reviewer, such as VoiceOver with
Safari or NVDA with Chrome/Firefox. Keep this pass focused and practical.

Check that:

- each route has one clear top-level heading that matches the page purpose
- the main landmark and primary navigation are discoverable
- the search input is announced as `Search games`
- game cards have understandable link names
- the game detail page announces the game title before lower-priority metadata
- Play and Fullscreen controls have clear accessible names
- the embedded game iframe has an understandable title
- loading/error/fullscreen fallback messages are perceivable when they appear
- internal sign-in fields are announced as Email and Password, and invalid sign-in feedback is
  perceivable

Do not require every game mechanic inside the iframe to be fully screen-reader playable in this
review. Record that separately as game-level accessibility debt if needed.

## Evidence to Capture

For each review, capture:

- staging URL and commit SHA
- browser, OS, and screen reader version when used
- reviewer name and date
- pass/fail result for keyboard-only review
- pass/fail result for screen-reader sanity review
- route-specific notes for any issue
- screenshot or short recording for focus traps, invisible focus, iframe recovery, or fullscreen
  problems

Do not paste secrets, internal passwords, session cookies, or provider credentials into evidence.

## Blockers vs Notes

Block release when:

- primary navigation, search, Play, Fullscreen, or sign-in cannot be reached by keyboard
- visible focus is missing on active controls in a way that prevents orientation
- focus becomes trapped in the page or iframe without a recoverable path
- a required control has no useful accessible name
- the game iframe launches but keyboard users cannot recover focus to page controls
- search or game-card navigation cannot be completed without a pointer
- internal sign-in labels or invalid-credential feedback are not perceivable

Record as a non-blocking note when:

- screen-reader copy is slightly verbose but still understandable
- lower-priority metadata is read in a less polished order
- a browser does not support element fullscreen but the fallback message appears and the player
  remains usable
- an individual game mechanic has deeper accessibility limits outside the shared player flow

## Scope Limits

This checklist does not certify WCAG conformance, test every assistive technology, or prove every
game mechanic is accessible. It proves the key public journey and internal sign-in path have been
manually reviewed for the highest-risk usability failures beyond automated checks.
