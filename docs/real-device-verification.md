# Real Device Verification

PixloGames already has desktop and mobile Playwright smoke coverage. This checklist is the manual
proof layer for physical devices and browser behavior that emulation does not fully prove.

Do not mark a release as real-device verified until this checklist has been run against a deployed
staging URL and the evidence has been captured.

## Required Device Matrix

| Priority | Device/browser | Why it matters |
| --- | --- | --- |
| Required | Physical iPhone on Safari | Proves iOS touch, viewport, iframe, and fullscreen fallback behavior. |
| Required | Physical Android phone on Chrome | Proves Android touch, iframe, and element fullscreen behavior. |
| Conditional | Tablet Safari or Chrome | Run when player sizing, orientation, or responsive game layout changed. |

Use current stable OS/browser versions when possible. Record the exact device model, OS version,
browser version, staging URL, commit SHA, operator, and date.

## Pre-Run Gate

Before touching real devices, the staging candidate should already have:

```powershell
npm run test:smoke
npm run test:smoke:mobile
npm run test:verify:games
npm run ops:release:verify
```

If these are not green, fix the automated blocker first. Real-device testing is for physical browser
proof, not for replacing failed automation.

## Core Flows

Run these flows on each required device/browser:

1. Open the staging home page.
   - Confirm the page loads without a browser error.
   - Confirm primary navigation is usable by touch.
   - Confirm the search field can be focused, typed into, and submitted.

2. Browse and search.
   - Open `/games`.
   - Scroll the game grid and tap at least one game card.
   - Search for `memory` and confirm Memory Match or relevant results are reachable.

3. Shared player launch.
   - Open `/games/endless-runner`.
   - Tap the primary play action.
   - Confirm the iframe becomes visible and does not show a load/error message.
   - Tap the play surface and confirm the runner responds to touch input.

4. Touch board game input.
   - Open `/games/tic-tac-toe` or `/games/memory-match`.
   - Tap the play action.
   - Tap at least one board/card cell.
   - Confirm the game state visibly changes and reset/replay remains usable.

5. Fullscreen behavior.
   - Tap the Fullscreen button when it is shown.
   - Android Chrome should enter or attempt fullscreen without breaking the player.
   - iPhone Safari may reject element fullscreen; this is acceptable only if the player remains usable
     and PixloGames shows the unavailable fullscreen message instead of failing silently.
   - Confirm the user can return to normal browsing after the attempt.

6. Orientation and viewport sanity.
   - Rotate once between portrait and landscape when the device supports it.
   - Confirm the player, navigation, and game controls remain reachable.
   - Confirm the page does not trap scrolling outside the iframe.

## Evidence to Capture

For each device/browser, capture:

- device model, OS version, browser version
- staging URL and commit SHA
- pass/fail result for each core flow
- one screenshot of the game detail page after the iframe loads
- one screenshot or short recording of fullscreen success or fallback
- issue notes with route, game slug, reproduction steps, and severity

Do not paste full connection strings, auth secrets, or provider credentials into evidence notes.

## Pass and Blocker Criteria

A real-device run passes when:

- home, browse, game detail, search, and player launch work on both required devices
- at least one action game and one touch board game accept real touch input
- iframe content remains visible and stable after play
- fullscreen succeeds where supported, or fails gracefully where unsupported
- any non-blocking deviations are documented with screenshots

Block release when:

- a required route fails to load on a required device
- the Play action does not reveal a playable iframe
- real touch input does not affect the tested games
- the player becomes unrecoverable after fullscreen or orientation changes
- search or browse cannot move the user to a game detail page
- layout overflow hides required controls or traps the user

## Scope Limits

This checklist does not prove every game mechanic, every OS/browser combination, network
throttling behavior, app-store style device certification, or full WCAG conformance. It proves the
highest-risk physical mobile browser path that automated viewport smoke cannot fully cover.
