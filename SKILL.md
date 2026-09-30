---
name: okona-game
description: Build a phone-controlled multiplayer HTML5 game and submit it to the Okona catalog. Up to six players scan a code on the screen and their phones become gamepads; Okona reviews the game and plays it in the Okona app. Use when the user wants a party game, a couch/TV/bar game, a game friends can play with their phones, or asks to put a game on Okona.
---

# Okona game

Okona (https://okonaonline.com) is a curated catalog of phone-controlled multiplayer games. You write an ordinary canvas/JS game that reads six pads from one script; Okona handles the phones, the pairing code and hosting, and reviews every game before it goes into the catalog. There are no public game links: games play inside Okona. This skill is the whole contract plus the workflow that ships a working game on the first try.

## Workflow

1. **Start from the starter, not from scratch.** `npm create okona-game <dir>` gives a lobby (join code until the room is full, six seats with names/colours pushed to the phones), the frame loop, and `game.js` with `start` / `update` / `draw` hooks holding a sample. Put the game in `game.js`; leave `index.html` alone unless the lobby itself must change. If the user already has a game, add the SDK to it instead (see "The contract").
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
p.buttons.a; p.justPressed('a');           // a b x y lb rb lt rt select start l3 r3 up down left right home
p.triggers.lt; p.triggers.rt;              // 0..1

Okona.on('join' | 'leave' | 'park' | 'resume', function (pad) {});
Okona.on('pairing', function () { Okona.drawQr(canvas); });   // redraw the join code on every pairing event
Okona.on('menu', function (open) {});      // the Okona menu opened/closed over the game (Home, or by itself while nobody is connected); pads already read neutral
Okona.players.setIdentity(pad, { name: 'Gold', icon: '🚗', accent: '#E8A525' });  // on the phone's pill
Okona.rumble(pad, low, high);  Okona.track('round_end', { winner: 1 });
Okona.mode;                                // 'live' (the Okona app) | 'sandbox' | 'standalone' (opened outside Okona)
```

Rules that follow from the runtime:
- **Seats are held.** A player whose phone screen turned off is `parked`, not gone. Freeze or fade them; do not kill them or free the seat. They return to the same seat (`resume`).
- **Show the join code in the lobby** until the room is full. In the Okona app players usually arrive already seated (the app shows its own code before the game loads), and the Okona menu shows the code over the game on Home and by itself whenever nobody is connected; your lobby's code lets late arrivals join without the menu covering the game, and it is the only way a phone joins in the sandbox. `Okona.drawQr(canvas)` paints the current code (a labelled placeholder until one exists), and `pairing` fires again when the image is ready, so redrawing on the event is correct.
- **`navigator.getGamepads()` is empty inside Okona** on purpose. Read `Okona.pads()` only.
- **Bundle libraries** into the folder rather than loading them from a CDN; a network that blocks one can break the game.
- Complete SDK reference: `reference/sdk.md`. This skill is published at https://github.com/earthcrosser/okona-game-skill. Live docs, always current, over MCP: `https://okonaonline.com/mcp` (tools `list_doc_sections`, `read_doc_section`, `search_docs`).

## What a good result looks like

The game boots into a lobby that seats whoever is already connected and shows the join code with its caption for everyone else, seats fill with names and colours as phones scan, P1 starts the round, late joiners are seated mid-round, a parked player is visibly "away" and comes back, a results screen offers "play again", and the phone pill shows each player's character. `examples/bumper-party/` is a complete one-file game that does all of this in ~200 lines.

## Do not

- Do not submit without being asked; sandbox first, submit on the word "go" (or equivalent).
- Do not add a keyboard/mouse control scheme for players — the keyboard exists for local testing only.
- Do not fetch or ship assets from arbitrary origins; everything in the build folder is fine.
- Do not read `navigator.getGamepads()` or use a game engine's own gamepad plugin for input.
- Do not invent SDK methods. If it is not in `reference/sdk.md`, check the live docs over MCP.
