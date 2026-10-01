# Submitting to Okona — CLI and API

Okona is a curated catalog: `publish` (on the CLI and the API) SUBMITS a game for review. The build is frozen at submission; Okona approves it into the catalog (status `live`) or sends it back (status `changes-requested`, with `rejectionReason`). There are no public game links: an approved game's `link` is its page in the Okona app, and games play only inside Okona.

## The CLI (`okona`, npm package `okona-cli`)

```
npx okona-cli login                       # device code: prints a URL + 8-char code; a HUMAN approves it in the portal
npx okona-cli login --key ok_live_…       # or paste a publish key from Account → API Keys
npx okona-cli whoami · npx okona-cli games
npx okona-cli create --title "Bumper Party" --description "Six cars, one arena." --runtime html5 [--genre party] [--controller basic|full|xl]
npx okona-cli controller <id> <basic|full|xl>       # the phone pad's layout — the game picks, the phone shows exactly that; no republish
npx okona-cli check <dir>                 # build shape, size caps, SDK tag, dialogs
npx okona-cli push <dir> --game <id> [--icon icon.png] [--screenshots <dir|a.png,b.png>] [--sandbox] [--publish]
npx okona-cli update <id> [--title T] [--description D] [--genre G] [--keywords "a, b"] [--youtube URL] [--icon icon.png] [--screenshots …] [--clear-screenshots] [--publish]
npx okona-cli game <id>                   # the full record: status (+ the reason if changes are requested), fields, icon, screenshots, build
npx okona-cli publish <id> · npx okona-cli unpublish <id> · npx okona-cli sandbox <id> · npx okona-cli link <id>   # submit for review · remove from the catalog · sandbox · its app page
```

With an `okona.json` in the game folder (the starter writes one) the record lives next to the build:

```json
{ "game": "<id>", "title": "Bumper Party", "description": "Six cars, one arena.", "genre": "multiplayer-party",
  "keywords": ["party", "cars"], "youtubeUrl": "", "controller": "full",
  "playersMin": 2, "playersMax": 6, "playTime": "under-5",
  "icon": "icon.png", "screenshots": "shots", "build": "." }
```

`npx okona-cli create` reads it and writes the new `game` id back; `npx okona-cli push .` then needs no `--game` and syncs the changed fields, the icon and the screenshots before the build — one command ships the whole game. `npx okona-cli update` with no id syncs the file without a build upload. Paths are relative to the file; `screenshots` is a folder (its images in name order: `1.png`, `2.png`, …) or a list; flags always win over the file. The manifest, icon and screenshots are left out of the build upload.

- Add `--json` to any command for machine-readable output (parse this rather than the human text).
- `OKONA_API_KEY` in the environment overrides the saved key (`~/.okona/config.json`) — the unattended/CI path.
- `push` detects the build kind: **HTML5** = `index.html` at the folder root; **Unity WebGL** = the folder Unity produced (a `Build/` with `*.loader.js`, Brotli `.br` files, optional `StreamingAssets/` beside `Build/`). Files upload straight to storage over signed URLs, in parallel.
- `--sandbox` deploys to the key owner's private sandbox (they open the returned URL signed in to the portal) — do this before `--publish` unless told otherwise. It is the only place outside Okona itself where real phones can pair: opening `index.html` in a browser gives keyboard + USB pads, and the optional dev harness (https://okonaonline.com/developers/okona-harness.zip, Python 3.7+, `python devtools/okona-test/okona-serve.py <dir>`) runs the real Okona shell with scripted phone players but has no relay room.
- `--publish` submits for review exactly like the portal's button: needs a title, a description, a complete build and an icon; allowed from `draft` or `changes-requested` (a 409 says why otherwise, e.g. already in review). Organizations may have up to 10 games in the catalog; the error message says so if the ceiling is hit.
- `update` is the portal's editor from the terminal — every field it has. The screenshot list is **declarative**: `--screenshots` (or the manifest's) REPLACES what is there, in that order (up to six, png/jpg/webp/gif ≤ 5 MB each); re-send to reorder, `--clear-screenshots` to empty. Changing a game that's in the catalog starts an update (status `updating`; players keep the approved version) — add `--publish`, or run `publish <id>`, to submit it for review. `game <id> --json` returns the record with media URLs.
- An approved update replaces the version players have. `unpublish` removes the game from the catalog; submit it again to bring it back.
- Games created by the CLI appear in the owner's portal like any other and can be edited there.

Exit codes: 0 ok, 1 refused/failed (message on stderr, or `{"error"}` with `--json`), 2 not logged in.

## The API (what the CLI calls)

Base `https://okonaonline.com/api/v1`, header `Authorization: Bearer ok_live_…` (a publish key, from Account → API Keys or `okona login`), JSON bodies, 60 requests/minute per key. A key acts for its organization; a game outside it is a 404.

| Method & path | Body → result |
|---|---|
| `GET /games` | `{ games: [{ id, title, runtime, status: draft\|in-review\|changes-requested\|live\|updating, rejectionReason, link (the app page once approved, else null), build: { complete, files, totalBytes }, hasIcon, … }] }` |
| `POST /games` | `{ title, description, runtime: "html5"\|"unity", genre?, keywords?, youtubeUrl?, controller?, playersMin?, playersMax?, playTime? }` → `{ game }` (201) |
| `GET /games/{id}` · `PATCH /games/{id}` | read the full record (`keywords` as a list, `youtubeUrl`, `icon` + `screenshots` as `{ name, url }`, `controller`, `build`); update `title` / `description` / `genre` / `keywords` (list or comma string, ≤ 20) / `youtubeUrl` (a YouTube link or `""`) / `playersMin` + `playersMax` (optional party facts: whole numbers 1–6, `null` clears) / `playTime` (`under-5`\|`5-15`\|`15-30`\|`30-plus` minutes, or `""`) / `runtime` (patching a game that's in the catalog starts an update; players keep the approved version) and/or `controller` — the phone pad's layout, `"full"` or `{ layout: "basic"\|"full"\|"xl" }`: a presentation field that applies to the next phone that connects and never starts an update. `game.controller.layout` reads it back (`basic` until the game picks) |
| `POST /games/{id}/build` | `{ runtime, files: [{ path, size }], icon?: { name, size } }` → `{ uploads: [{ path, url, method: "PUT", headers }], icon?, expiresAt }` — PUT each file to its `url` with exactly those headers (20-minute expiry; they include a signed byte range, so each `size` must be the file's exact size in bytes). HTML5: the tree, root `index.html`, ≤ 50 MB, ≤ 500 files. Unity: exactly `loader.js`, `data.br`, `framework.js.br`, `wasm.br` (renamed from Unity's base name) plus `StreamingAssets/…`; each file ≤ 512 MB, the build ≤ 1 GB and ≤ 1000 files. The previous staged build is cleared first. |
| `POST /games/{id}/build/commit` | the same body once uploaded → `{ game }` (sizes are read from storage) |
| `POST /games/{id}/media` | `{ icon?: { name, size }, screenshots?: [{ name, size }] }` → `{ icon?: { name, storagePath, url, method, headers }, screenshots?: [same], expiresAt }` — PUT each image to its `url` with those headers. Icon ≤ 2 MB replaces the current one; screenshots ≤ 6 × 5 MB, png/jpg/webp/gif, and the list is DECLARATIVE (it becomes the game's list in that order; `[]` clears; absent = untouched). |
| `POST /games/{id}/media/commit` | `{ icon?: { name, storagePath }, screenshots?: [{ name, storagePath }] }` with the plan's paths once uploaded → `{ game }`; replaced images are deleted; on a live game this starts an update |
| `POST /games/{id}/publish` | SUBMIT for review → `{ game, link, submitted: true }`; 400 with the reason when a precondition fails, 409 when it can't be submitted now |
| `POST /games/{id}/unpublish` · `POST /games/{id}/sandbox` | → `{ game }` · `{ url }` |

Errors: `{ "error": { "code", "message" } }` with the matching HTTP status (400 refused body / precondition, 401 bad key, 403 wrong key type, 404 not in this org, 429 rate limit or live-game ceiling).

## Getting a key for an agent

1. The person runs `npx okona-cli login` where the agent runs and approves the code at the printed URL — needs a browser signed in to the developer portal. Tell them this is coming and wait.
2. Or the person creates a **publish key** under *Account → API Keys* in the portal and gives it to the agent as `OKONA_API_KEY` (or `npx okona-cli login --key …`).

Never paste a key into the game, a commit, or the chat. Keys can be revoked in the portal at any time.
