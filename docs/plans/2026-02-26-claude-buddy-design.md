# Claude Desktop Buddy - Design Document

## Overview

A desktop companion app — an animated ASCII art tamagotchi-style Claude character that lives on the desktop. It detects Claude Code activity in real-time and animates accordingly, with sound effects and full interactivity.

## Tech Stack

- **Electron** — transparent, frameless, always-on-top window
- **Chokidar** — file watching for Claude Code logs
- **Web Audio API** — procedural sound effects
- **Plain HTML/CSS/JS** — no framework needed
- **electron-builder** — packaging (future)

## Architecture

Three core systems:

### 1. Renderer

- Transparent, frameless, always-on-top Electron window
- ASCII art rendered in a `<pre>` element with colored `<span>` tags
- Monospace font, warm amber/orange color palette
- Default size ~200px, resizable via right-click menu or scroll wheel
- Click-through on transparent areas, draggable on the character

### 2. State Detector

- Watches Claude Code JSONL transcript logs in `~/.claude/projects/`
- Uses `chokidar` to monitor for new log entries
- Parses tool call entries to determine current activity
- Maps tool names to animation states
- Detects Claude Code start/stop via process or log activity

### 3. Animation Engine

- Frame-based ASCII animation with configurable frame rate
- Each state has multiple frames that cycle
- Smooth transitions between states (brief transition frames)
- The character: a small round luminous orb creature with big expressive eyes, tiny arms, subtle glow — Claude as a tamagotchi

## Animation States

| State | Trigger | Description |
|-------|---------|-------------|
| Idle/Wandering | No Claude Code activity | Looks around, blinks, sways, explores curiously |
| Thinking | Claude generating text | Eyes shift, sparkle effect, pondering pose |
| Coding | Edit/Write tool calls | Typing animation, focused expression |
| Researching | Read/Grep/Glob tools | Looking through magnifying glass, reading |
| Bash | Bash tool calls | Excited/determined, terminal vibes |
| Listening | User typing to Claude | Perked up, attentive expression |

## Sound System

- Procedural sounds via Web Audio API (no audio files needed)
- Soft key clicks for coding, whoosh for researching, blips for thinking, etc.
- Volume slider in right-click menu, default ~20%
- Mute toggle for quick silence
- Volume/mute preferences persisted to disk

## Interactions

- **Drag** — click and drag the character anywhere on desktop
- **Right-click menu** — Close, resize options, volume slider, mute, always-on-top toggle, About
- **Resize** — via right-click submenu or mouse scroll wheel
- **Position persistence** — remembers window position between launches

## Character Design

A small (8-12 lines tall) round luminous creature rendered in colored ASCII:
- Warm amber/orange tones (Claude brand colors)
- Big expressive eyes that change shape per state
- Tiny arms that gesture
- Subtle glow/sparkle effects via ASCII characters
- Expressions change through eye shapes, arm positions, and body shifts

## Data Flow

```
Claude Code writes JSONL logs
        ↓
Chokidar detects file changes
        ↓
Parser extracts tool call type
        ↓
State machine transitions to new state
        ↓
Animation engine loads new frame set + triggers sound
        ↓
Renderer updates <pre> element with colored ASCII
```

## Preferences (persisted to JSON)

- Window position (x, y)
- Window scale
- Volume level
- Mute state
- Always-on-top toggle

## Project Structure

```
claude-buddy/
├── package.json
├── main.js              # Electron main process
├── preload.js           # Bridge between main/renderer
├── src/
│   ├── index.html       # Transparent window markup
│   ├── renderer.js      # Animation rendering & UI
│   ├── styles.css       # Styling
│   ├── animations/      # ASCII frame definitions per state
│   │   ├── idle.js
│   │   ├── thinking.js
│   │   ├── coding.js
│   │   ├── researching.js
│   │   ├── bash.js
│   │   └── listening.js
│   ├── detector.js      # Claude Code log watcher & parser
│   ├── sounds.js        # Web Audio procedural sound effects
│   └── preferences.js   # Load/save user preferences
└── docs/
    └── plans/
        └── 2026-02-26-claude-buddy-design.md
```
