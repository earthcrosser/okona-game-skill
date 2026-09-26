# Okona JavaScript SDK — reference

`<script src="https://okonaonline.com/sdk/okona.js"></script>` defines `window.Okona`. ES2015, no dependencies, ~15 KB. Inside Okona the game runs in a frame and the SDK talks to the host; opened as a plain page it falls back to the keyboard and USB gamepads.

## Pads

`Okona.pads()` → an array of 6 pad objects (index 0–5, seat = index + 1), **updated in place**. Call it once per frame; `justPressed()` compares against the previous `pads()` call.

**Call `pads()` exactly once per frame and keep the array.** A second call — or `Okona.pad(i)`, which refreshes all six — resets `justPressed()` for that frame. You never need it elsewhere: `Okona.rumble(i, …)`, `Okona.players.setIdentity(i, …)` and `clearIdentity(i)` take a plain seat index (or the pad object) and never touch input state.

| Field | Type | Meaning |
|---|---|---|
| `index` / `slot` | 0–5 / 1–6 | The seat. Seats are held while a controller is away; nobody is renumbered. |
| `connected` | bool | A controller holds this seat. |
| `kind` | `'phone'` \| `'gamepad'` \| `'keyboard'` \| `null` | Informational; input is identical. |
| `parked` | bool | Controller gone (phone page closed, pad asleep), seat held. Pause/fade the player. |
| `buttons` | object of bools | `a b x y lb rb lt rt select start l3 r3 up down left right home` |
| `pressed(name)` / `justPressed(name)` | fn | Held now / went down since the last `pads()` call |
| `axes` | `{lx, ly, rx, ry}` −1..1 | **+Y is down** (screen space, Gamepad API convention) |
| `triggers` | `{lt, rt}` 0..1 | Analog triggers |
| `mask` | uint32 | Raw button bits (standard Gamepad indices) |

`Okona.pad(i)` → one pad (it refreshes all six, so it counts as your once-per-frame call — don't mix it with `pads()` in the same frame). `Okona.MAX_PLAYERS === 6`. `Okona.BUTTONS` = the 17 names in bit order.

The phone pad shows the layout the game picked on its Controller tab (see Hosting facts): **Basic** = d-pad, A/B/X/Y, Select/Start; **Full** adds both sticks, triggers and shoulders; **XL** = an oversized d-pad and A/B only. A game that reads sticks or triggers must pick Full — on Basic those controls don't exist on the phone. Home (`home`) is forwarded to the game — decide what it means, or ignore it.

## Events

`Okona.on(name, fn)` / `Okona.off(name, fn)`; the pad object is the argument for seat events.

- `ready` — the SDK knows where it runs; `Okona.mode` is `'live'`, `'sandbox'` or `'standalone'` (until `ready` fires it reads `'hosted'` inside a frame — branch on it only after `ready`). `Okona.ready(fn)` runs immediately if already ready. Start the frame loop here.
- `join` — a seat was taken (first connection of a controller). Set identity here.
- `leave` — permanently freed (rare: eviction when all six seats are wanted).
- `park` / `resume` — the controller went away / the same one came back to the same seat.
- `pairing` — the join code changed **or its image just became drawable**. Redraw on every one.

## Pairing (the join code)

`Okona.pairing` — `available` (bool), `url`, `caption` (a short line such as "Uses your phone's internet" — print it under the code), `version` (bumps on change), `qrPng` (PNG bytes), `qrUrl` (a `blob:` URL for an `<img>`), `qrImage` (decoded image once loaded). `Okona.pairing.onChange(fn)` = `on('pairing', fn)`.

`Okona.drawQr(canvas, opts?)` → paints the code into the canvas, square, centred, white ground; returns `true` when a real code was drawn, `false` for the placeholder ("Preparing join code…" inside Okona, "Scan to join / phones join when hosted on Okona" standalone). Options: `{ margin, background, placeholderColor }`. Safe to call every frame (draws from the decoded image, never fetches). Show it large while the room is empty, small once people are in, hidden at six.

The URL is reissued periodically; a code drawn once and never redrawn goes stale. Redraw on `pairing`.

`available` can also turn `false` mid-run: when the screen's connection drops for more than a few seconds the code would lead nowhere, so a `pairing` event withdraws it (`url` null; `drawQr` paints the placeholder), and a later one brings a fresh code. Hide or grey the join panel while it's false; seated players keep playing.

## Identity on the phone

`Okona.players.setIdentity(padOrIndex, { name, icon, accent })` — `name` ≤ 24 chars; `icon` = an emoji / short text **or** a relative path to an image in the build folder (`'icons/tank.png'` — png/jpg/webp/gif/svg; external URLs are refused); `accent` = `'#rrggbb'` (the pill's dot). `Okona.players.clearIdentity(pad)` reverts to "Player N". `Okona.players.connected()` → count. Identity is a no-op standalone (returns `false`).

## Rumble, analytics, misc

- `Okona.rumble(padOrIndex, low, high)` — dual-motor magnitudes 0..1 (~200 ms); takes a seat index or the pad object, so no extra `pads()` call is needed. Phones do not vibrate through the relay; gamepads that support it do.
- `Okona.track(name, props)` — a custom analytics event on the live link (name ≤ 64 chars, props JSON ≤ 1 KB, ≤ 500 per page load); appears on the developer's Analytics tab and in the Analytics API as `customEvents`. Returns `false` standalone.
- `Okona.mode` — `'live'` | `'sandbox'` | `'standalone'` after `ready` (`'hosted'` before it, inside a frame); `Okona.isHosted` — `true` inside Okona.
- `Okona.watermark` — `true` when the free-tier "Powered by Okona" mark is shown (leave a corner clear top-left).
- `Okona.buildUrl` — the build's base URL inside Okona.
- `Okona.snapshot` — the raw 106-byte input snapshot (the same bytes the Unity SDK reads), for engines that want bytes.

## Standalone fallback (local dev)

Not inside Okona: keyboard = P1 on the first mapped key (WASD/IJKL sticks, arrows d-pad, Space A, LShift B, F X, R Y, Q/E bumpers, Z/X triggers, Tab/Enter select/start, C/V L3/R3); standard-mapping USB/Bluetooth gamepads take the next seats; `pairing.available` is `false`; `drawQr` paints the placeholder. Blur/hidden releases held keys.

## Hosting facts that shape a game

- The link is `https://play.okonaonline.com/games/?id=<id>`; it runs in any browser or webview, full screen, no Okona UI over the game. If the page fails to load it retries by itself (unattended screens).
- Free tier: a small "Powered by Okona" watermark top-left and a chip on the phone pad. Okona Pro (per organization) removes both, same link, and includes the Analytics API.
- Controller tab (per game, no republish): the game PICKS its phone-pad layout and the phone shows exactly that — players can't switch. Basic (d-pad, A/B/X/Y, Select/Start — what a game gets until it picks), Full (adds both sticks + triggers + shoulders — pick it if the game reads sticks or triggers) or XL (oversized d-pad + A/B, first-time players). Set it from the CLI: `okona controller <id> full`.
- Builds: a folder with `index.html` at its root, ≤ 50 MB, ≤ 500 files, no dotfiles. Text assets are gzipped by the host. Assets are referenced relatively, exactly as on disk.
- Old screens: signage WebViews can be pre-2020 Chromium. Prefer ES2015 syntax in shipped code, avoid CSS `inset` and flex `gap`, and never rely on a CDN at runtime.
- Dialogs (`alert`, `confirm`, `prompt`), popups and top-level navigation are blocked inside the game frame.
- The game frame is an isolated origin: `localStorage`, `sessionStorage`, IndexedDB and cookies are unavailable (access throws — wrap it in `try`/`catch` and keep running without it), and the game can't reach the page around it — only the SDK talks to Okona. Its own files load normally (relative URLs; `fetch`/XHR work).
