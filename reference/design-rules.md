# Designing for a TV across the room and a phone in the hand

Okona games are played on a screen nobody touches — a TV, a projector, a bar's display, a stream — by people holding phones. Most single-player web-game habits are wrong here. Check the game against this list before submitting it.

## Input

- **A d-pad, A/B/X/Y and Select.** That is the phone pad on the Basic layout. The sticks, bumpers and triggers exist on real gamepads and on the phone's Full layout; a game that reads them picks Full on its Controller tab. Start and Home belong to Okona: in the Okona app Start opens the Okona menu and Home goes to the TV's home screen, and neither reaches the game. Begin on A ("press A to play"), never "Press Start", never draw a Start glyph, and never build a pause menu. **Select is the game's**: its own menu (options, how to play, scores) or a per-player toggle, never pause.
- **No mouse, no keyboard, no touch on the game.** The keyboard fallback is for the developer's local testing only. Never show "press any key" or "click to start" — say "press A".
- **Buttons, not gestures.** A phone pad has no swipe/tilt. Menus move with the d-pad or stick and confirm with A, back with B. Show buttons by position (a diamond of four with the one to press lit), not by letter: brands put different letters in the same place. Keep the words "Start" and "Select" for those buttons ("Choose", not "P1 select").
- **Analog is coarse on a phone.** Thumbs on glass are less precise than a real stick; add a dead zone (~0.15) and forgiving hitboxes.
- **Racing and driving games.** An analog throttle needs the Full layout on phones (Basic has no triggers); read the amount from `triggers`, never `buttons.rt`. A Basic-pad game that wants feathering ramps a held button itself.

## Players

These are the **Okona game standards** (https://okonaonline.com/developers/docs.html#standards); every catalog game follows them.

- **Up to six, often connected before the first frame, more arriving mid-game.** In the Okona app controllers usually connect before the game loads.
- **Okona handles joining, everywhere.** The Okona app shows the join code (Scan to play, the menu's Controllers), and so does the sandbox (up while nobody is connected; Start brings it back): the game draws no code and no "scan the code" text.
- **A controller becomes a player by pressing A.** Until then it is only connected: show "press A to join" on its empty spot, never play it (a pad left on the couch never becomes a ghost player). No "how many players?" screen: the players are whoever pressed A.
- **Pick one join style and name it in the description.** Lobby (A joins, B leaves), drop-in (A joins at any moment) or between rounds (A mid-round queues the player for the next round). Seat late joiners without restarting the round.
- **Any joined player drives the flow.** Starting a round, replaying, leaving a menu: any joined player presses A. Never "P1 only": seat 1 may be empty. Say "press A to start" on screen.
- **Away is not gone.** A `parked` player has put their phone down or their screen turned off; their seat is held and they come back as the same player. Keep their character, spot and score until the round ends; freeze/fade them (or let a CPU take over) and make them unhittable; never stall the round for them, never respawn them as new. When everyone is away, draw no "waiting for players" screen: Okona opens its menu by itself.
- **Freeze on the Okona menu.** While `Okona.menuOpen` is true (the `menu` event) a real-time game stops its timers, physics and spawns. Pads already read neutral and the menu covers the screen: no pause screen of the game's own.
- **Identity on the phone.** When a controller becomes a player (its first A), set a name, an emoji or image, and the player's colour, so each person can look at their own hand and know which car/blob/paddle is theirs.
- **The party facts match the game.** `playersMin`/`playersMax` are what the game actually allows.
- **Pick the pad layout your game uses.** On the game's Controller tab (or `okona controller <id> <basic|full|xl>`), choose Basic, Full or XL — the phone shows exactly that, and players can't switch. A game that reads sticks or triggers needs Full; a two-button game is friendliest on XL.

## The screen

- **16:9, 1920×1080 logical, scaled to fit.** Draw to a fixed logical size and scale (the starter does). Keep everything essential inside the middle 90% for TVs that overscan.
- **Big type, high contrast.** Body text ≥ 28px logical, headlines ≥ 56px, strong colour against a dark ground. It is read from three metres away.
- **No hover states, no cursor, no tooltips.** Nothing on the screen is pointed at.
- **Never block.** No `alert()`/`confirm()`/`prompt()` (blocked, and nobody can dismiss a dialog with a gamepad); no popups; no navigation away. An error should render on the canvas.

## Pace and sessions

- **Rounds, not campaigns.** 30 seconds to 3 minutes, then a results screen and "play again". People drift in and out of a party.
- **Explain by doing.** One line of instruction on the lobby ("Grab the coins. Most coins after 45 seconds wins."), then start. No tutorial screens.
- **Idle is normal.** The lobby may sit for a long time between rounds; keep it alive and light (no heavy particle systems on the lobby).

## The build

- A folder with `index.html` at its root. ≤ 50 MB total, ≤ 500 files, no dotfiles or `node_modules`.
- **Bundle every library into the folder.** Some networks block CDNs; a game that fetches Phaser from the internet at boot is a game that sometimes doesn't start.
- Assets referenced relatively, exactly as on disk. Case-sensitive on the host.
- No persistent storage: the game runs in an isolated origin, so `localStorage`/IndexedDB/cookies throw. Wrap any use in `try`/`catch`; a round-based party game shouldn't need saves anyway.
- Prefer ES2015 syntax in the shipped bundle and avoid CSS `inset` / flex `gap` — older TV browsers and webviews.
- **Fast on a Google TV streamer, not just your machine.** The low end Okona measures against (the onn 4K Plus: four Cortex-A55 cores, 2 GB) runs out of CPU before GPU. Keep per-frame work flat (pool objects, update only what changed). Hundreds of Canvas 2D calls a frame (clips, gradients, paths) saturate its GPU thread: for a busy scene use a WebGL renderer that batches sprites (Phaser, PixiJS), or draw static layers to an offscreen canvas once. A 1080p TV's webview is 960×540 CSS px at 2×, so a canvas sized by `devicePixelRatio` draws 4× the pixels; a heavy game sizes it to the CSS pixels.
- An icon (png/jpg/webp/gif, ≤ 2 MB) for the portal.

## Pre-submit checklist

- [ ] Nothing reads Start or Home; nothing on screen says "Press Start".
- [ ] The game draws no join code; in the sandbox, phones join through Okona's (Start brings it back) and the game freezes while it is up.
- [ ] A connected controller does nothing until it presses A; then it gets a seat, a name and a colour on its phone.
- [ ] Any joined player + A starts, even with seat 1 empty; a late joiner gets in by the game's join style.
- [ ] Close a phone's controller page mid-round: the round carries on, the player is visibly "away", not removed; reopen it: same seat, same score.
- [ ] Open the Okona menu (Start) mid-round: the game freezes; Resume: it carries on.
- [ ] Results screen with "press A to play again".
- [ ] Nothing depends on keyboard, mouse or touch on the game.
- [ ] Type is legible on a TV from a couch.
- [ ] `npx okona-cli check <dir>` passes; the sandbox run with real phones felt right.
