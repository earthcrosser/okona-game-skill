# Designing for a TV across the room and a phone in the hand

Okona games are played on a screen nobody touches — a TV, a projector, a bar's display, a stream — by people holding phones. Most single-player web-game habits are wrong here. Check the game against this list before publishing.

## Input

- **One stick, A/B/X/Y, bumpers, a d-pad.** That is the phone pad. The right stick, triggers and Home exist on real gamepads; treat them as optional extras.
- **No mouse, no keyboard, no touch on the game.** The keyboard fallback is for the developer's local testing only. Never show "press any key" or "click to start" — say "P1: press A".
- **Buttons, not gestures.** A phone pad has no swipe/tilt. Menus move with the d-pad or stick and confirm with A, back with B.
- **Analog is coarse on a phone.** Thumbs on glass are less precise than a real stick; add a dead zone (~0.15) and forgiving hitboxes.

## Players

- **Up to six, arriving mid-game.** Show the join code (large when the room is empty, small once people are in, hidden at six) and seat late joiners without restarting the round.
- **Parked ≠ gone.** A `parked` player has put their phone down or their screen turned off; their seat is held and they come back as the same player. Freeze/fade them, keep their score, don't free the seat, don't respawn them as new.
- **Identity on the phone.** On `join`, set a name, an emoji or image, and the player's colour, so each person can look at their own hand and know which car/blob/paddle is theirs.
- **P1 drives the flow.** Starting a round, replaying, leaving a menu: seat 1 presses A. Say so on screen.

## The screen

- **16:9, 1920×1080 logical, scaled to fit.** Draw to a fixed logical size and scale (the starter does). Keep everything essential inside the middle 90% for TVs that overscan.
- **Big type, high contrast.** Body text ≥ 28px logical, headlines ≥ 56px, strong colour against a dark ground. It is read from three metres away.
- **No hover states, no cursor, no tooltips.** Nothing on the screen is pointed at.
- **Leave the top-left corner quiet.** The free tier's "Powered by Okona" mark sits there.
- **Never block.** No `alert()`/`confirm()`/`prompt()` (blocked, and nobody can dismiss a dialog with a gamepad); no popups; no navigation away. An error should render on the canvas.

## Pace and sessions

- **Rounds, not campaigns.** 30 seconds to 3 minutes, then a results screen and "play again". People drift in and out of a party.
- **Explain by doing.** One line of instruction on the lobby ("Grab the coins. Most coins after 45 seconds wins."), then start. No tutorial screens.
- **Idle is normal.** On an unattended screen the lobby may sit for hours; keep it alive and light (no heavy particle systems on the lobby).

## The build

- A folder with `index.html` at its root. ≤ 50 MB total, ≤ 500 files, no dotfiles or `node_modules`.
- **Bundle every library into the folder.** A venue's network may block CDNs; a game that fetches Phaser from the internet at boot is a game that sometimes doesn't start.
- Assets referenced relatively, exactly as on disk. Case-sensitive on the host.
- Prefer ES2015 syntax in the shipped bundle and avoid CSS `inset` / flex `gap` — old signage WebViews.
- An icon (png/jpg/webp/gif, ≤ 2 MB) for the portal.

## Pre-publish checklist

- [ ] Lobby shows a large join code and the caption; seats fill with names and colours as phones scan.
- [ ] P1 + A starts; a late joiner is seated mid-round.
- [ ] Close a phone's controller page: the player is visibly "away", not removed; reopen it: same seat, same score.
- [ ] Results screen with "P1: press A to play again".
- [ ] Nothing depends on keyboard, mouse or touch on the game.
- [ ] Type is legible on a TV from a couch; nothing essential in the top-left corner.
- [ ] `npx okona check <dir>` passes; the sandbox run with real phones felt right.
