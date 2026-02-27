# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Buddy is a desktop companion Electron app featuring CLAWD, an animated pixel-art crab that reacts to Claude Code activity in real-time. It watches Claude Code's JSONL log files, detects tool usage, and responds with animations and procedural sound effects.

## Commands

- `npm start` — Run the app in development (launches Electron)
- `npm run build` — Build without packaging (output in `dist/`)
- `npm run dist` — Package as Windows installer (NSIS + portable exe)
- No test suite exists; testing is manual via `npm start`

## Architecture

### Data Flow

```
Claude Code JSONL logs (~/.claude/projects/)
  → ClaudeDetector (chokidar file watcher, 500ms polling)
  → State/Mood extracted from tool_use entries
  → IPC to renderer (claude-state, claude-mood, scale-changed)
  → AnimationEngine (canvas) + SoundSystem (Web Audio API)
```

### Process Boundary

- **Main process** (`main.js`): Window management, preferences persistence, tray, IPC routing, ClaudeDetector instantiation
- **Preload** (`preload.js`): Secure IPC bridge exposing `window.claude` API
- **Renderer** (`src/renderer.js`): UI interactions (drag, context menu, scroll-resize), orchestrates AnimationEngine and SoundSystem

### Key Modules

| Module | Role |
|--------|------|
| `src/detector.js` | Watches `~/.claude/projects/` for JSONL changes, maps tool names to animation states (Read→researching, Edit→coding, Bash→bash, Task→thinking, AskUserQuestion→listening) |
| `src/mood-detector.js` | Keyword/pace analysis with exponential decay scoring; detects frustrated, celebrating, confused, excited, sleepy moods |
| `src/animation-engine.js` | Renders 32×32 pixel-art sprites to canvas with per-pixel scaling; supports mood overlays on top of base animations |
| `src/sounds.js` | Procedural audio via Web Audio API oscillators/noise; state sounds (one-shot) and coding loop (continuous clicking) |
| `src/tray-manager.js` | System tray with green/red icons for connection status |

### Sprite System

- Palette defined in `src/sprites/palette.js` (32 named color constants)
- Mood overlays in `src/sprites/mood-overlays.js` (sparse pixel patches)
- Animation frames in `src/animations/*.js` — each exports `{ fps, frames }` where frames are 1024-element arrays of hex colors or null

### Preferences

Persisted to Electron's userData path as `preferences.json`:
```
{ x, y, scale (0.4-3.0), volume (0-1), muted, alwaysOnTop }
```

## MCP Servers

### PixelLab (`pixellab`)

Pixel art generation API available via MCP. All creation tools are async — they return a job ID and take a few minutes to process. Use the corresponding `get_*` tool to poll for completion.

- **Characters:** `create_character` → `get_character`. Supports humanoid/quadruped, 4/8 directions, proportion presets (chibi, cartoon, heroic, etc.)
- **Animations:** `animate_character` with a `template_animation_id` (walking, idle, etc.) on an existing character
- **Top-down tilesets:** `create_topdown_tileset` — 16-tile Wang sets for terrain transitions. Chain with `lower_base_tile_id` for consistency
- **Sidescroller tilesets:** `create_sidescroller_tileset` — 16-tile platformer sets with transparent backgrounds
- **Isometric tiles:** `create_isometric_tile` — thin (floors), thick (platforms), or block (cubes) shapes
- **Map objects:** `create_map_object` — transparent-background props for game maps

Docs: https://api.pixellab.ai/mcp/docs

## Platform Notes

- Chokidar uses polling (`usePolling: true`, 500ms interval) because native file watchers are unreliable on Windows
- Window dragging uses `moveWindow` IPC instead of CSS `-webkit-app-region: drag` to avoid Windows system menu hijack
- The window is transparent and frameless; all UI is canvas-rendered
