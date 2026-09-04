# Publishing to Okona — CLI and API

## The CLI (`okona`, npm package `okona-cli`)

```
npx okona-cli login                       # device code: prints a URL + 8-char code; a HUMAN approves it in the portal
npx okona-cli login --key ok_live_…       # or paste a publish key from Account → API Keys
npx okona-cli whoami · npx okona-cli games
npx okona-cli create --title "Bumper Party" --description "Six cars, one arena." --runtime html5 [--genre party]
npx okona-cli check <dir>                 # build shape, size caps, SDK tag, dialogs
npx okona-cli push <dir> --game <id> [--icon icon.png] [--sandbox] [--publish]
npx okona-cli publish <id> · npx okona-cli unpublish <id> · npx okona-cli sandbox <id> · npx okona-cli link <id>
```

- Add `--json` to any command for machine-readable output (parse this rather than the human text).
- `OKONA_API_KEY` in the environment overrides the saved key (`~/.okona/config.json`) — the unattended/CI path.
- `push` detects the build kind: **HTML5** = `index.html` at the folder root; **Unity WebGL** = the folder Unity produced (a `Build/` with `*.loader.js`, Brotli `.br` files, optional `StreamingAssets/` beside `Build/`). Files upload straight to storage over signed URLs, in parallel.
- `--sandbox` deploys to the key owner's private sandbox (they open the returned URL signed in to the portal) — do this before `--publish` unless told otherwise.
- `--publish` runs the same publish as the portal button: needs a title, a description, a complete build and an icon. Free organizations may have up to 10 live games; the error message says so if the ceiling is hit.
- Publishing an already-live game replaces it in place; the link never changes. `unpublish` takes the link offline (shows "not available", retries on its own).
- The game link is `https://play.okonaonline.com/games/?id=<id>`. Games created by the CLI appear in the owner's portal like any other and can be edited there.

Exit codes: 0 ok, 1 refused/failed (message on stderr, or `{"error"}` with `--json`), 2 not logged in.

## The API (what the CLI calls)

Base `https://okonaonline.com/api/v1`, header `Authorization: Bearer ok_live_…` (a **publish** key — analytics keys are refused with a 403 that says so), JSON bodies, 60 requests/minute per key. A key acts for its organization; a game outside it is a 404.

| Method & path | Body → result |
|---|---|
| `GET /games` | `{ games: [{ id, title, runtime, status: draft\|live\|updating, link, build: { complete, files, totalBytes }, hasIcon, … }] }` |
| `POST /games` | `{ title, description, runtime: "html5"\|"unity", genre? }` → `{ game }` (201) |
| `GET /games/{id}` · `PATCH /games/{id}` | read; update `title` / `description` / `genre` / `runtime` (patching a live game starts an update; the live build keeps serving) |
| `POST /games/{id}/build` | `{ runtime, files: [{ path, size }], icon?: { name, size } }` → `{ uploads: [{ path, url, method: "PUT", headers }], icon?, expiresAt }` — PUT each file to its `url` with exactly those headers (20-minute expiry). HTML5: the tree, root `index.html`, ≤ 50 MB, ≤ 500 files. Unity: exactly `loader.js`, `data.br`, `framework.js.br`, `wasm.br` (renamed from Unity's base name) plus `StreamingAssets/…`. The previous staged build is cleared first. |
| `POST /games/{id}/build/commit` | the same body once uploaded → `{ game }` (sizes are read from storage) |
| `POST /games/{id}/publish` | → `{ game, link }`; 400 with the reason when a precondition fails |
| `POST /games/{id}/unpublish` · `POST /games/{id}/sandbox` | → `{ game }` · `{ url }` |

Errors: `{ "error": { "code", "message" } }` with the matching HTTP status (400 refused body / precondition, 401 bad key, 403 wrong key type, 404 not in this org, 429 rate limit or live-game ceiling).

## Getting a key for an agent

1. The person runs `npx okona-cli login` where the agent runs and approves the code at the printed URL — needs a browser signed in as the organization owner. Tell them this is coming and wait.
2. Or the person creates a **publish key** under *Account → API Keys* in the portal and gives it to the agent as `OKONA_API_KEY` (or `npx okona-cli login --key …`).

Never paste a key into the game, a commit, or the chat. Keys can be revoked in the portal at any time.
