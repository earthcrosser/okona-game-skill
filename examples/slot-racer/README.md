# Slot Racer

A game for [Okona](https://okonaonline.com), for one player or up to six. Each person plays with a phone or a gamepad and joins by pressing A. Built on [Phaser](https://phaser.io) 3.90, the HTML5 engine Okona recommends.

- `index.html`: the lobby, seats and loop, built to the [Okona game standards](https://okonaonline.com/developers/docs.html#standards) (A joins, any joined player starts, the game freezes while the Okona menu is open, and it draws no join code: Okona shows it), plus the Phaser config Okona recommends for a TV box. It rarely needs changes.
- `game.js`: **your game**. The sample is a slot-car race (hold A for gas, left and right to change lanes, lift before the corners) to replace with your own: `create`, `start`, `update`, `results`, and the join/leave hooks.
- `phaser.min.js` + `PHASER-LICENSE.md`: Phaser 3.90.0 (MIT), bundled so no network can block it.
- `icon.png`: the icon shown in the Okona portal (replace it).
- `okona.json`: the catalog record: title, description, genre, keywords, the icon, screenshots. `okona push` syncs it.

## Play it locally

Open `index.html` in a browser (or `npx serve .`). The keyboard is P1: arrows or WASD, Space is A, Shift is B. Phones need the real thing, below.

## Keep it fast on a TV

Okona plays on TV boxes with 2 GB shared by the CPU and the GPU. The setup in `index.html` is the one in [Phaser on Okona](https://okonaonline.com/developers/docs.html#phaser): a 960x540 canvas scaled to fit, and Phaser's effects pipelines off (`disablePreFX` / `disablePostFX`, or Phaser reserves GPU memory you never use). Keep both. Paint textures once (`textures.addImage`), reuse sprites, and change text only when its words change. Then play your sandbox on a real TV box for ten minutes before you submit.

## Submit to Okona

The `okona` CLI is the npm package `okona-cli` (Node 18.17+); `npx` runs it without installing.

```
npx okona-cli login                 # once: approve a code in the portal
npx okona-cli create                # reads okona.json, writes the new game id back into it
npx okona-cli push . --sandbox      # catalog + icon + build in one go; try it with real phones first
npx okona-cli push . --publish      # submit for review: Okona approves it into the catalog or sends it back
```

Screenshots: put up to six images in a `shots/` folder and add `"screenshots": "shots"` to `okona.json`: the next push uploads them in name order (1.png, 2.png, …). `npx okona-cli update --title "…"` changes a field without a build upload; `npx okona-cli game <id>` shows what the portal has.

Docs: https://okonaonline.com/developers/docs.html#html5 · Phaser on Okona: https://okonaonline.com/developers/docs.html#phaser · SDK reference: https://okonaonline.com/developers/docs.html#js-sdk · The contract in one line: `Okona.pads()` once per frame, `Okona.on('join'|'leave'|'park'|'resume'|'menu')`, `Okona.menuOpen`, `Okona.players.setIdentity()`, `Okona.save`, `Okona.rumble()`, `Okona.track()`.
