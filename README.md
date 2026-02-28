# Claude Buddy

Desktop companion that reacts to your Claude Code activity in real-time. A pixel-art character lives in an isometric room, moving between stations, playing animations, and making SNES-style sounds as you code.

![Claude Buddy Screenshot](assets/icon.png)

## Features

- **Reactive character** — walks to different furniture based on what Claude Code is doing (coding, researching, running bash, thinking, listening)
- **Mood detection** — reacts to frustration, celebration, confusion, excitement, and more with unique animations and sounds
- **Flow state** — gold aura and speed lines when you're rapid-fire calling tools
- **Error flinch** — character recoils when tools error out
- **Eureka moments** — fireball animation when research transitions to coding
- **Victory celebration** — front-flip with confetti when builds succeed
- **Idle wandering** — character explores the room when idle, poking at furniture
- **Lo-fi coding music** — procedural Chrono Trigger-style 8-bar loop during sustained coding
- **SNES-style sounds** — procedural audio via Web Audio API for every state and mood
- **Session stats** — tracks tool calls, time per state, flow duration (accessible from system tray)
- **Session stats** — tracks tool calls, time per state, flow duration (accessible from system tray)
- **System tray** — connection status, auto-start with Windows, always-on-top toggle, room visibility
- **Auto-update** — checks GitHub releases on startup, downloads in background, one-click restart to install

## Install

Download the latest release from [Releases](https://github.com/tumourlove/claude-buddy/releases):

- **Installer**: `claude-buddy-Setup-x.x.x.exe` — installs to AppData with Start Menu shortcut, supports auto-update
- **Portable**: `claude-buddy-portable.exe` — single file, run anywhere (no auto-update)

## Build from Source

```bash
git clone https://github.com/tumourlove/claude-buddy.git
cd claude-buddy
npm install
npm start          # run in development
npm run dist       # package Windows installer + portable
```

## Controls

| Input | Action |
|-------|--------|
| Right-click | Volume, mute, close |
| Scroll wheel | Resize window |
| Shift + drag | Rearrange furniture |
| D key | Toggle demo mode (cycles all states/moods) |
| Click tray icon | Show/hide window |
| Tray → Check for Updates | Download and install latest version |

## How It Works

Claude Buddy watches Claude Code's JSONL log files at `~/.claude/projects/`. When Claude Code uses tools (Read, Edit, Bash, etc.), the companion character moves to the corresponding station in its room and plays contextual animations with procedural sound effects.

The app runs as a transparent, frameless, always-on-top overlay with a system tray icon showing connection status.

## License

ISC
