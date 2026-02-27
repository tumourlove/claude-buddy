# Steampunk CLAWD Redesign — Design Document

## Overview

Major visual overhaul of Claude Buddy: transform CLAWD from a 32×32 pixel-art sprite on a transparent background into a 96×96 steampunk mech-crab living in an isometric workshop office. The crab moves between stations for different activity states, has always-animating chimney smoke, multiple animation variants per state, expressive mood effects, and autonomous idle behavior.

## Reference

User-drawn concept art: steampunk mech-crab with rust-orange armored shell, gold rivets/trim, glowing red eye visor, steam chimney with smoke puffs, metallic claws with silver tips, gold mechanical joints.

## Confirmed Design Decisions

- **Sprite size:** 96×96 pixels
- **Scene size:** 480×480 base canvas, scalable 0.4–3.0×
- **Camera:** Isometric (top-down angled)
- **Character directions:** South-west and south-east (for left/right movement)
- **Art pipeline:** PixelLab MCP for character + furniture, procedural canvas for effects
- **Format:** PNG sprite sheets (replacing 32×32 hex array system)
- **Background:** Toggleable solid room vs transparent (right-click menu "Show Room")

## Scene Architecture

### Rendering Layers (painted bottom to top)

| Layer | Content | Animation |
|-------|---------|-----------|
| 0 — Floor | Isometric stone/wood floor tiles | Static |
| 1 — Walls | Back walls with pipes, gears, steam vents | Subtle pulsing vents |
| 2 — Furniture (back) | Stations behind crab depth-wise | Subtle idles (blinking terminal, flickering lamp) |
| 3 — Character | CLAWD the steampunk mech-crab (96×96) | Walks between stations, state-specific actions |
| 4 — Furniture (front) | Stations in front of crab for depth | Same as layer 2 |
| 5 — Effects | Chimney smoke, steam puffs, mood particles | Always animating |

### Transparent Mode

Layers 0–1 (floor/walls) hidden. Furniture and crab render directly over desktop. Toggled via right-click menu "Show Room" checkbox.

## Workshop Stations

| State | Station | Location (approx) |
|-------|---------|--------------------|
| coding | Workbench with typewriter | Center-right |
| researching | Bookshelf with magnifying glass | Top-left |
| bash | Steam-powered terminal console | Top-right |
| thinking | Armchair with pipe | Center-left |
| listening | Front-facing stool | Bottom-left |
| idle/sleep | Hammock | Bottom-right |

Pipes and gears decorate the walls. Steam vents in corners.

## Animation System

### Per-State Animation Pools

Each state has 2–4 animation variants selected randomly. On each loop cycle, there's a chance to swap to a different variant.

| State | Variants |
|-------|----------|
| **coding** | Typing furiously, pause-think-type, adjusting monocle then typing, pulling workbench lever |
| **researching** | Flipping through book, magnifying glass scanning, pulling books off shelf, comparing two scrolls |
| **bash** | Pulling terminal levers, turning valves, pressing buttons rapidly, reading gauges |
| **thinking** | Pacing back and forth, sitting in armchair tapping claw, staring at ceiling, scribbling on notepad |
| **listening** | Perking up on stool, leaning forward attentively, tilting head, cupping claw to ear |
| **idle** | Sleeping in hammock, wandering between stations, polishing claws, tinkering with gadget, staring out window, napping at desk |

### State Transition Flow

1. State change detected → crab walks to target station (tween ~0.5–1s)
2. Random animation picked from state's pool
3. Animation loops; on each cycle, chance to swap variant
4. Smoke chimney runs on independent timer across all states

### Idle Behavior

- 10s timeout → picks random idle animation
- After each idle anim finishes, picks another (wander, nap, tinker, etc.)
- 30s disconnected timeout → favors sleep/rest animations

## Mood Expression System

Moods layer on top of activity states — the crab keeps doing its station activity but the mood modifies how it does it and spawns effect particles.

| Mood | Crab Visual | Effects Layer |
|------|-------------|---------------|
| **frustrated** | Faster/bigger chimney smoke, claws clench, eye glows brighter | Steam bursts from vents, gear/bolt particles |
| **celebrating** | Claws raise, eye turns green/gold, bouncy movement | Golden sparks, confetti gears, steam whistles |
| **confused** | Head tilts, eye flickers, claws scratch shell | Question-mark gear floating, smoke spirals erratically |
| **excited** | Faster movement, eye pulses, claws snap | Exclamation gears, rapid steam puffs, small bounces |
| **sleepy** | Eye dims, slower movement, slight droop | Smoke slows to wisps, zzz gears floating up |

## PixelLab Asset Strategy

### Character

- `create_character`: steampunk mech-crab, 96×96, isometric view
- 2 directions: south-west (walking left), south-east (walking right)
- `animate_character` for walking template
- Activity-specific animations: use closest PixelLab templates + custom frame variations

### Scene Furniture

- `create_map_object` for each station: workbench, bookshelf, terminal, armchair, stool, hammock
- Isometric perspective ("low top-down" or "high top-down")
- Transparent backgrounds for layering

### Background

- `create_isometric_tile` for floor tiles
- Walls/pipes as map objects or procedural canvas drawing

### Effects

- Procedural canvas drawing (no PixelLab needed)
- Smoke: animated circles with fade/drift
- Sparks/gears: small particle sprites drawn via canvas
- Mood particles: same approach

## Engine Refactor

### Files Replaced

- `src/animation-engine.js` → complete rewrite as `src/scene-engine.js`
- `src/animations/*.js` (6 files) → deleted, replaced by PNG sprite sheets in `assets/sprites/`
- `src/sprites/palette.js` → deleted
- `src/sprites/mood-overlays.js` → deleted, replaced by `src/mood-effects.js`

### Files Unchanged

- `src/detector.js` — still emits states
- `src/mood-detector.js` — still emits moods
- `src/sounds.js` — unchanged (new sounds can be added later)

### Files Modified

- `main.js` — new window size (480×480 base), background toggle IPC, new preference
- `preload.js` — add `onBackgroundToggle` channel
- `src/renderer.js` — wire new scene engine instead of old animation engine

### New Files

- `src/scene-engine.js` — layered renderer, station positions, character movement tweening
- `src/smoke-effect.js` — independent chimney smoke particle system
- `src/mood-effects.js` — mood particle spawner (sparks, gears, zzz, steam bursts)
- `assets/sprites/` — character PNG sprite sheets
- `assets/scene/` — background room PNG, furniture object PNGs

### New Preference

- `showRoom` (boolean, default: true) — toggle room background visibility
