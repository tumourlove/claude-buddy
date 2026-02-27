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
  → IPC to renderer (claude-state, claude-mood, scale-changed)
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
| `src/detector.js` | Watches `~/.claude/projects/` for JSONL changes, maps tool names to states (Read→researching, Edit→coding, Bash→bash, Task→thinking, AskUserQuestion→listening) |
| `src/mood-detector.js` | Keyword/pace analysis with exponential decay scoring; detects frustrated, celebrating, confused, excited, sleepy moods |
| `src/mood-effects.js` | Mood-reactive particle effects (red bursts, gold sparks, purple ?, orange sparks, gray zzz) |
| `src/sounds.js` | Procedural audio via Web Audio API oscillators/noise; state sounds (one-shot) and coding loop (continuous clicking) |
| `src/tray-manager.js` | System tray with green/red icons for connection status |

### Scene System (Isometric Room)

The scene renders a diamond-shaped isometric room with:
- **Procedural room geometry** defined in `ROOM` constant (center, halfW, halfH, wallH)
- **Diamond floor** with isometric-transformed tile texture (uses `ctx.setTransform` to map regular grid to diamond axes)
- **Two back walls** meeting at the top vertex with neon accents
- **Furniture props** placed inside the diamond, depth-sorted with character using painter's algorithm
- **Shift+click drag** to rearrange furniture (positions auto-save to preferences)
- **Station system** — character walks to furniture-linked positions when state changes

### Sprite System

- Character sprites: 96×96 PNG files in `assets/sprites/`
- Static rotations: `clawd-sw.png`, `clawd-se.png` (west/east facing)
- Animations: `assets/sprites/animations/{name}/{direction}/frame_NNN.png`
- Available animations: breathing-idle (4 frames), walking (6)
- Walking animations play automatically when the character moves between stations
- Thought bubbles with emoji appear above the character on state changes (💻 coding, 📖 researching, ⚡ bash, 💭 thinking, 👂 listening, 😴 idle)
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

Then queue animations (breathing-idle, walking, pushing, picking-up, drinking are used):
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

Furniture props (block shape, 6 pieces):
```
create_isometric_tile:
  description: "<furniture description>"
  size: 64, tile_shape: "block", detail: "highly detailed"
```

Download via `get_isometric_tile` → download URL (isometric tile downloads work reliably).

**Note:** `create_map_object` produces higher quality results but the download endpoint has been unreliable (500 errors). Use `create_isometric_tile` with `block` shape as a reliable alternative.

### 3. Update Scene

- Place floor tile at `assets/scene/floor-tile.png`
- Place 6 furniture props at `assets/scene/{workbench,bookshelf,terminal,armchair,stool,hammock}.png`
- Update wall colors in `_drawProceduralRoom()` in `src/scene-engine.js`
- Update mood effect colors in `src/mood-effects.js` if desired
- Adjust `ROOM` geometry constants if needed

### 4. File Naming Convention

The renderer expects these exact filenames:
- `assets/sprites/clawd-sw.png` — west-facing static sprite
- `assets/sprites/clawd-se.png` — east-facing static sprite
- `assets/sprites/animations/{anim}/{direction}/frame_NNN.png`
- `assets/scene/floor-tile.png` — isometric floor tile
- `assets/scene/{workbench,bookshelf,terminal,armchair,stool,hammock}.png` — furniture

## MCP Servers

### PixelLab (`pixellab`)

Pixel art generation API available via MCP. All creation tools are async — they return a job ID and take a few minutes to process. Use the corresponding `get_*` tool to poll for completion.

- **Characters:** `create_character` → `get_character`. Supports humanoid/quadruped, 4/8 directions, proportion presets (chibi, cartoon, heroic, etc.). Max ~20 concurrent jobs.
- **Animations:** `animate_character` with a `template_animation_id`. Each animation uses 4 job slots (one per direction). Good ones: breathing-idle, walking, pushing, picking-up, drinking. Avoid: crouching (looks weird).
- **Isometric tiles:** `create_isometric_tile` — thin (floors), thick (platforms), or block (furniture/cubes). Downloads work reliably. Use `detail: "highly detailed"` (not "high detail").
- **Map objects:** `create_map_object` — transparent-background props. Higher quality but download endpoint returns 500 errors frequently.
- **Top-down tilesets:** `create_topdown_tileset` — 16-tile Wang sets for terrain transitions
- **Sidescroller tilesets:** `create_sidescroller_tileset` — 16-tile platformer sets

Docs: https://api.pixellab.ai/mcp/docs

## Platform Notes

- Chokidar uses polling (`usePolling: true`, 500ms interval) because native file watchers are unreliable on Windows
- Window dragging uses `moveWindow` IPC instead of CSS `-webkit-app-region: drag` to avoid Windows system menu hijack
- The window is transparent and frameless; all UI is canvas-rendered
- EPIPE errors suppressed in main.js (stdout broken pipe when parent process closes)
