# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Buddy is a desktop companion Electron app featuring an animated pixel-art character that reacts to Claude Code activity in real-time. It watches Claude Code's JSONL log files, detects tool usage, and responds with animations and procedural sound effects. The character lives in an isometric room that can be themed.

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
  → IPC to renderer (claude-state, claude-mood, claude-flow, claude-flinch, claude-eureka, claude-tasks, scale-changed)
  → SceneEngine (canvas) + SoundSystem (Web Audio API)
```

### Process Boundary

- **Main process** (`main.js`): Window management, preferences persistence, tray, IPC routing, ClaudeDetector instantiation
- **Preload** (`preload.js`): Secure IPC bridge exposing `window.claude` API
- **Renderer** (`src/renderer.js`): UI interactions (drag, context menu, scroll-resize, furniture dragging), orchestrates SceneEngine and SoundSystem

### Key Modules

| Module | Role |
|--------|------|
| `src/scene-engine.js` | Isometric diamond-room renderer with layered drawing, furniture management, character tweening, animation pool system, and painter's algorithm depth sorting |
| `src/detector.js` | Watches `~/.claude/projects/` for JSONL changes, maps tool names to states, detects flow state (5+ tools in 15s), error flinch (tool_result errors), eureka moment (research→edit transition), task list parsing (TaskCreate/TaskUpdate) |
| `src/mood-detector.js` | Keyword/pace analysis with exponential decay scoring; detects frustrated, celebrating, confused, excited, sleepy, determined, proud, curious moods |
| `src/mood-effects.js` | Mood-reactive particle effects, flow state aura with speed lines, eureka burst, victory confetti |
| `src/sounds.js` | SNES-style procedural audio via Web Audio API; state sounds, mood sounds, lo-fi coding music loop (Chrono Trigger style), FF victory fanfare |
| `src/tray-manager.js` | System tray with CLAWD face icon (dimmed when disconnected), settings, stats submenu, auto-update UI |
| `src/stats-tracker.js` | Session stats: tool call counts, state durations, flow time tracking |
| `src/update-checker.js` | Auto-updater via electron-updater; checks GitHub releases, downloads in background, restart-to-install |

### Scene System (Isometric Room)

The scene renders a diamond-shaped isometric room with:
- **Procedural room geometry** defined in `ROOM` constant (center, halfW, halfH, wallH)
- **Diamond floor** with isometric-transformed tile texture (uses `ctx.setTransform` to map regular grid to diamond axes)
- **Two back walls** meeting at the top vertex with neon accents
- **Furniture props** placed inside the diamond, depth-sorted with character using painter's algorithm
- **Shift+click drag** to rearrange furniture (positions auto-save to preferences)
- **Station system** — character walks to furniture-linked positions when state changes
- **Chalkboard task list** on left wall — classic green chalkboard displaying Claude Code's current task list. Parses `TaskCreate` tool_result for real task IDs and `TaskUpdate` tool_use for status changes. Completed tasks shown dimmed with strikethrough, sorted to bottom. Panel geometry precomputed as `CHALK_PANEL` module constant using left wall direction vectors (`LWALL_DX/DY`). Text rendered with isometric transform `ctx.transform(-ux, -uy, 0, 1, 0, 0)` (negated because left wall has negative X direction). Tasks reset when new JSONL file appears (new session).
- **LED ticker tape** on right wall — retro dot-matrix display scrolling funny state-specific messages (e.g., coding → "HACKING THE MAINFRAME", researching → "PONTIFICATING"). Breaking news interrupts for celebrating/eureka/flow state. Panel geometry precomputed as `TICKER_PANEL` module constant.

### Sprite System

- Character sprites: 96×96 PNG files in `assets/sprites/`
- Static rotations: `clawd-sw.png`, `clawd-se.png` (west/east facing)
- Animations: `assets/sprites/animations/{name}/{direction}/frame_NNN.png`
- Available animations: breathing-idle (4f), walking (6f), fight-stance-idle-8-frames (8f), fireball (6f), falling-back-death (7f), front-flip (6f)
- Walking animations play automatically when the character moves between stations
- One-shot animation system: `playOneShot(animKey, { emoji, onComplete })` — temporarily plays a non-looping animation then reverts
- Idle wandering: after 15s idle, CLAWD walks to random furniture, shows curiosity emojis
- Thought bubbles persist for the duration of a state (💻 coding, 📖 researching, ⚡ bash, 💭 thinking, 👂 listening, 😴 idle, 🌐 browsing, 🏗️ building, 🫡 delegating)
- Mood bubbles appear above thought bubbles (😤 frustrated, 🎉 celebrating, ❓ confused, 🔥 excited, 💤 sleepy, 💪 determined, 🌟 proud, 🔎 curious)
- Special reactive animations: 💥 flinch on errors, 💡 eureka on research→edit, 🎉 victory flip on celebrating
- Scene tiles: `assets/scene/` — floor-tile.png (isometric), furniture props (isometric blocks)
- Animation pool: multiple variants per state, randomly selected to avoid repetition (30% swap chance per loop)

### Preferences

Persisted to Electron's userData path as `preferences.json`:
```
{ x, y, scale (0.4-3.0), volume (0-1), muted, alwaysOnTop, showRoom, furniturePositions }
```

## Theming Guide

To create a new theme (replace character + room), follow these steps:

### 1. Generate Character with PixelLab

```
create_character:
  description: "<character appearance description>"
  size: 96
  n_directions: 4
  body_type: humanoid (or quadruped for animals)
  proportions: {"type": "preset", "name": "chibi"}
  view: "low top-down"
  detail: "high detail"
  shading: "detailed shading"
```

Then queue animations (breathing-idle, walking, pushing, picking-up, fight-stance-idle-8-frames, fireball, falling-back-death, front-flip are used):
```
animate_character:
  character_id: "<id>"
  template_animation_id: "breathing-idle" (repeat for each animation)
```

Download the ZIP via `get_character` → download URL. Extract to `assets/sprites/`.

### 2. Generate Isometric Tiles with PixelLab

Floor tile (thin tile shape):
```
create_isometric_tile:
  description: "<floor description>"
  size: 64, tile_shape: "thin tile", detail: "highly detailed"
```

Furniture props (block shape, 4 pieces):
```
create_isometric_tile:
  description: "<furniture description>"
  size: 64, tile_shape: "block", detail: "highly detailed"
```

Download via `get_isometric_tile` → download URL (isometric tile downloads work reliably).

**Note:** `create_map_object` produces higher quality results but the download endpoint has been unreliable (500 errors). Use `create_isometric_tile` with `block` shape as a reliable alternative.

### 3. Update Scene

- Place floor tile at `assets/scene/floor-tile.png`
- Place 4 furniture props at `assets/scene/{workbench,bookshelf,terminal,armchair}.png`
- Update wall colors in `_drawProceduralRoom()` in `src/scene-engine.js`
- Update mood effect colors in `src/mood-effects.js` if desired
- Adjust `ROOM` geometry constants if needed

### 4. File Naming Convention

The renderer expects these exact filenames:
- `assets/sprites/clawd-sw.png` — west-facing static sprite
- `assets/sprites/clawd-se.png` — east-facing static sprite
- `assets/sprites/animations/{anim}/{direction}/frame_NNN.png`
- `assets/scene/floor-tile.png` — isometric floor tile
- `assets/scene/{workbench,bookshelf,terminal,armchair}.png` — furniture

## MCP Servers

### PixelLab (`pixellab`)

Pixel art generation API available via MCP. All creation tools are async — they return a job ID and take a few minutes to process. Use the corresponding `get_*` tool to poll for completion.

- **Characters:** `create_character` → `get_character`. Supports humanoid/quadruped, 4/8 directions, proportion presets (chibi, cartoon, heroic, etc.). Max ~20 concurrent jobs.
- **Animations:** `animate_character` with a `template_animation_id`. Each animation uses 4 job slots (one per direction). Good ones: breathing-idle, walking, fight-stance-idle-8-frames, fireball, falling-back-death, front-flip. Avoid: crouching, pushing, picking-up (look bad).
- **Isometric tiles:** `create_isometric_tile` — thin (floors), thick (platforms), or block (furniture/cubes). Downloads work reliably. Use `detail: "highly detailed"` (not "high detail").
- **Map objects:** `create_map_object` — transparent-background props. Higher quality but download endpoint returns 500 errors frequently.
- **Top-down tilesets:** `create_topdown_tileset` — 16-tile Wang sets for terrain transitions
- **Sidescroller tilesets:** `create_sidescroller_tileset` — 16-tile platformer sets

Docs: https://api.pixellab.ai/mcp/docs

## Reactive Features

| Feature | Detection | Animation | Sound |
|---------|-----------|-----------|-------|
| **Flow state** | 5+ tool calls in 15s sliding window | fight-stance-idle-8-frames + gold aura + speed lines | Rapid tool sounds provide cue |
| **Error flinch** | `is_error` or error regex in tool_result | falling-back-death one-shot + 💥 | Detuned square blip + noise |
| **Eureka moment** | 3+ research states → coding/bash | fireball one-shot + 💡 + gold sparkles | Ascending triangle arpeggio |
| **Victory** | `celebrating` mood triggers | front-flip one-shot + confetti | FF victory fanfare |
| **Idle wandering** | 15s of idle state | Walks to random furniture, shows emoji | — |
| **Coding music** | 10s sustained coding state | — | Lo-fi 8-bar pentatonic loop (Chrono Trigger style) |
| **LED ticker** | State/mood changes | Scrolling dot-matrix text on right wall; `>>> BREAKING <<<` for celebrating/eureka/flow | — |
| **Chalkboard** | TaskCreate/TaskUpdate tool calls | Green chalkboard on left wall; checkbox list with strikethrough on complete | — |

**Demo mode**: Press `D` to cycle through all states and moods automatically (2.5s intervals).

## Distribution

- **Auto-update** via `electron-updater`: checks GitHub releases on startup, downloads in background, tray shows progress percentage, click to restart and install
- **Release workflow**: `.github/workflows/release.yml` — push a version tag (`git tag v1.x.x && git push origin v1.x.x`) to trigger GitHub Actions build and draft release
- **Artifact names**: `claude-buddy-Setup-x.x.x.exe` (installer) and `claude-buddy-portable.exe` (standalone) — hyphenated names required for auto-update `latest.yml` compatibility
- **`latest.yml`** must be included in every release for electron-updater to detect new versions
- Auto-update only works with the installer version, not portable

## Platform Notes

- Chokidar uses polling (`usePolling: true`, 500ms interval) because native file watchers are unreliable on Windows
- Window dragging uses `moveWindow` IPC instead of CSS `-webkit-app-region: drag` to avoid Windows system menu hijack
- The window is transparent and frameless; all UI is canvas-rendered
- EPIPE errors suppressed in main.js (stdout broken pipe when parent process closes)
- Single instance lock via `app.requestSingleInstanceLock()` — second launch focuses existing window
- App icon stamped via `rcedit` in `scripts/afterPack.js` hook (native `signAndEditExecutable` fails without admin privileges on Windows)
- Character depth sorting uses `charY + 32` for sort position — increase if character renders behind furniture after offset changes

## Station Positioning

Character positions are calculated as `furniture.x + 32 + offsetX, furniture.y + 32 + offsetY` where offsets are in `STATION_CONFIG` (scene-engine.js). Key notes:
- Saved furniture positions in `%APPDATA%/claude-buddy/preferences.json` override default positions in renderer.js
- Always check actual saved positions when tuning offsets — they may differ significantly from defaults
- In isometric view: +X = right, +Y = down; moving "north" = decrease offsetY, "east" = increase offsetX
- Depth sorting (painter's algorithm) compares `charY + 32` vs `furniture.y + imageHeight` — if character renders behind furniture, increase the +32 constant
