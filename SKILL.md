---
name: okona-game
description: Build a phone-controlled multiplayer HTML5 game and submit it to the Okona catalog. Up to six players scan a code on the screen and their phones become gamepads; Okona reviews the game and plays it in the Okona app. Use when the user wants a party game, a couch/TV/bar game, a game friends can play with their phones, or asks to put a game on Okona.
---

# Okona game

Okona (https://okonaonline.com) is a curated catalog of phone-controlled multiplayer games. You write an ordinary canvas/JS game that reads six pads from one script; Okona handles the phones, the pairing code and hosting, and reviews every game before it goes into the catalog. There are no public game links: games play inside Okona. This skill is the whole contract plus the workflow that ships a working game on the first try.

## Workflow

1. **Start from the starter, not from scratch.** `npm create okona-game <dir>` gives a lobby built to the Okona game standards (a controller joins by pressing A, six seats with names/colours pushed to the phones, any joined player starts, the game freezes while the Okona menu is open, no join code: Okona shows it), the frame loop, and `game.js` with `start` / `update` / `draw` hooks holding a sample. Put the game in `game.js`; leave `index.html` alone unless the lobby itself must change. If the user already has a game, add the SDK to it instead (see "The contract").
2. **Design for a TV and a phone pad** — read `reference/design-rules.md` before writing gameplay. The short version: one stick + A/B/X/Y + bumpers, no mouse/keyboard/touch on the game, large type, 16:9, players join and leave mid-game, never call `alert()`.
3. **Play it locally.** Open `index.html` in a browser (or `npx serve`). The SDK falls back to the keyboard as P1 (WASD/arrows, Space = A, Shift = B) and to USB gamepads, so the loop can be exercised without Okona. If you can run a browser, do; if not, at least confirm the file parses and every referenced asset exists.
4. **Check, then push to the sandbox first.**
   ```
   npx okona-cli check <dir>
   npx okona-cli push <dir> --sandbox          # with the starter's okona.json; otherwise --game <id> --icon icon.png
   ```
   `check` catches the shape mistakes (no root `index.html`, over 50 MB, missing SDK tag, dialogs, a broken `okona.json`). The sandbox is the developer's private copy with real phones.
5. **Submit for review only when the human says so.** `npx okona-cli push <dir> --publish` (or `npx okona-cli publish <id>`) submits it: the build is frozen and Okona approves it into the catalog or sends it back with what to change. `npx okona-cli game <id>` shows the status (`in-review`, `changes-requested` with the reason, `live`); if changes are requested, fix them and submit again. The sandbox (step 4) is where the human plays it on real phones meanwhile.
6. **Fill in the catalog from here too.** Title, description, genre, keywords, a YouTube link, the icon and up to six screenshots all live in `okona.json` next to the build (the starter writes it; `push` syncs it) — or `npx okona-cli update <id> --keywords "…" --screenshots ./shots`. Screenshots: capture the game at 16:9, name them `1.png`, `2.png`, … so they upload in order. Nothing about a game needs the portal.

The first time on a machine: `npx okona-cli login` prints a URL and an 8-character code; the person opens the URL signed in to the Okona portal and approves it (this needs a human — say so and wait). For unattended use they can create a publish key under *Account → API Keys* and set `OKONA_API_KEY`. Create the game record once: `npx okona-cli create` in the folder (reads `okona.json`, writes the new id back into it) — or `npx okona-cli create --title "…" --description "…" --runtime html5` → prints the id. Pick the phone-pad layout the game uses: `--controller basic|full|xl` on create, or `npx okona-cli controller <id> full` later (Full if the game reads sticks or triggers; the phone shows exactly that layout). Full CLI/API detail: `reference/publishing.md`.

## The contract

One script tag, one global:

```html
<script src="https://okonaonline.com/sdk/okona.js"></script>
```

```js
var pads = Okona.pads();                   // six pads, call ONCE per frame and keep the array (a 2nd call, or Okona.pad(i), resets justPressed; rumble/setIdentity take an index)
var p = pads[0];
p.connected; p.parked; p.kind;             // seat taken · controller away (seat held) · 'phone'|'gamepad'|'keyboard'
p.axes.lx; p.axes.ly;                      // −1..1, +Y is DOWN (Gamepad API convention)
p.buttons.a; p.justPressed('a');           // a b x y lb rb lt rt select l3 r3 up down left right (no start or home: they are Okona's, SDK 1.5.0)
p.triggers.lt; p.triggers.rt;              // 0..1

Okona.on('join' | 'leave' | 'park' | 'resume', function (pad) {});   // join = a controller CONNECTED; it becomes a player when it presses A
Okona.on('menu', function (open) {});      // the Okona menu opened/closed over the game (Start, or by itself while nobody is connected); pads read neutral; freeze a real-time game while Okona.menuOpen
Okona.players.setIdentity(pad, { name: 'Gold', icon: '🚗', accent: '#E8A525' });  // on the phone's pill
Okona.rumble(pad, low, high);  Okona.track('round_end', { winner: 1 });
Okona.mode;                                // 'live' (the Okona app) | 'sandbox' | 'standalone' (opened outside Okona)
```

Rules that follow from the runtime, the **Okona game standards** (every catalog game follows them; Okona checks them in review; full text: https://okonaonline.com/developers/docs.html#standards):
- **Start and Home are Okona's.** Start opens the Okona menu, Home goes to the TV's home screen; never read them, never show "Press Start" or a Start glyph. **Select is the game's** (its own menu: options, how to play, scores), never pause. A confirms, B goes back; show buttons by position, not letter.
- **Okona handles joining, everywhere.** The Okona app shows the join code (Scan to play; the menu's Controllers), and so does the sandbox (up while nobody is connected; Start brings it back): the game draws no code and no "scan the code" text, ever. (`Okona.drawQr` / `Okona.pairing` remain only for games built before the standards.)
- **A controller becomes a player by pressing A.** Before that it is only connected: show "press A to join" on an empty spot, never play it. No "how many players?" screen: the players are whoever pressed A. Set identity then.
- **One join style, named in the description:** lobby (A joins, B leaves), drop-in (A joins any time) or between rounds (A mid-round queues for the next). **Any joined player** starts or replays with A; never "P1 only" (seat 1 may be empty).
- **Away is not gone.** A player whose phone screen turned off is `parked`: keep their character, spot and score until the round ends; freeze/fade them (or a CPU takes over) and make them unhittable; the round never waits. They return to the same seat (`resume`) as the same player. When everyone is away, draw no "waiting for players" screen: Okona opens its menu by itself.
- **Freeze on the Okona menu.** While `Okona.menuOpen` a real-time game stops its timers, physics and spawns; no pause screen of its own.
- **`navigator.getGamepads()` is empty inside Okona** on purpose. Read `Okona.pads()` only.
- **Bundle libraries** into the folder rather than loading them from a CDN; a network that blocks one can break the game.
- Complete SDK reference: `reference/sdk.md`. This skill is published at https://github.com/earthcrosser/okona-game-skill. Live docs, always current, over MCP: `https://okonaonline.com/mcp` (tools `list_doc_sections`, `read_doc_section`, `search_docs`).

## What a good result looks like

The game boots into a lobby that shows every connected controller with "press A to join"; each one that presses A gets a seat with a name and colour on its phone pill; any joined player starts the round with A; late joiners press A to come in (mid-round or at the next round, by the game's join style); a parked player is visibly "away", keeps their score and comes back as themselves; opening the Okona menu (Start) freezes the game; a results screen offers "press A to play again"; nothing says "Press Start"; and the game draws no join code (Okona shows it, in the app and in the sandbox). `examples/bumper-party/` is a complete one-file game that does all of this in ~200 lines.

## Do not

- Do not submit without being asked; sandbox first, submit on the word "go" (or equivalent).
- Do not add a keyboard/mouse control scheme for players — the keyboard exists for local testing only.
- Do not fetch or ship assets from arbitrary origins; everything in the build folder is fine.
- Do not read `navigator.getGamepads()` or use a game engine's own gamepad plugin for input.
- Do not read Start or Home, build a pause screen, or draw a join code (see the standards above).
- Do not invent SDK methods. If it is not in `reference/sdk.md`, check the live docs over MCP.
