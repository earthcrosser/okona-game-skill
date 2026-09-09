# okona-game — an Agent Skill

Build and publish a **phone-controlled multiplayer HTML5 game on [Okona](https://okonaonline.com)** with your AI coding assistant. Up to six players scan a code on the screen and their phones become gamepads; Okona hosts the game at one link.

This repository is the skill in the open [Agent Skills](https://agentskills.io) format: `SKILL.md` (the workflow and the SDK contract), `reference/` (the full SDK, TV-and-phone design rules, publishing via the `okona` CLI and API) and a complete example game: `examples/bumper-party/` (a gamepad party game).

## Install

**Claude Code** — into a project:

```
git clone https://github.com/earthcrosser/okona-game-skill .claude/skills/okona-game
```

or for every project: `git clone https://github.com/earthcrosser/okona-game-skill ~/.claude/skills/okona-game`. Any agent that reads Agent Skills works the same way — put this folder in its skills directory. A zip of the same content is at https://okonaonline.com/developers/okona-skill.zip.

Then ask: *"Make a four-player game we can play on the TV with our phones, and put it on Okona."*

## What the skill makes the agent do

Start from `npm create okona-game`, design for a TV across the room and a phone pad in the hand, test locally (the SDK falls back to the keyboard), run `npx okona-cli check`, push to your private sandbox with `npx okona-cli push … --sandbox`, and publish only when you say so. Logging in (`npx okona-cli login`) needs a person to approve a code in the Okona portal; the skill knows to stop and ask.

## Links

- Docs: https://okonaonline.com/developers/docs.html#html5 · https://okonaonline.com/developers/docs.html#publish-api
- Live docs over MCP: `https://okonaonline.com/mcp`
- CLI: `npx okona-cli` · Starter: `npm create okona-game`
- Maintained as part of the Okona platform (a private repository); this repository and the zip are the published copies. Questions or problems: this repo's Issues, or support@okonaonline.com

MIT licensed.
