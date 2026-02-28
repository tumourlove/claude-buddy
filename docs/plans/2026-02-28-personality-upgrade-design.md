# CLAWD Personality & Reactivity Upgrade

## Summary

Make CLAWD feel alive — reactive to flow, errors, eureka moments, and idle curiosity. Add lo-fi SNES coding music, richer mood/state detection, and new animations.

## New Animations (PixelLab)

| Animation | Template | Frames | Used For |
|-----------|----------|--------|----------|
| flow-state | fight-stance-idle-8-frames | 8 | Flow state (rapid tool calls) |
| eureka | fireball | 6 | Search→edit transition |
| flinch | falling-back-death | 7 | Tool errors |
| victory | front-flip | 6 | Celebrating mood |

Existing: breathing-idle (4f), walking (6f), pushing (6f), picking-up (5f)

## Feature 1: Flow State

**Detection** (`detector.js`): Track tool call timestamps in a sliding window. 5+ tool calls within 15 seconds = `flow: true`. Decays after 10s of no tools. Emitted as separate IPC event `claude-flow`.

**Visuals** (`mood-effects.js`):
- Pulsing warm gold aura: radial gradient centered on CLAWD, alpha oscillates 0.1–0.3
- 4–6 speed lines radiating outward, slowly rotating
- Replaces breathing-idle with **flow-state** animation (fight-stance-idle, 8 frames, higher fps)

**Sound**: No new sound — the rapid tool sounds + coding music provide enough audio cues.

## Feature 2: Error Flinch

**Detection** (`detector.js`): On `tool_result` with `is_error: true`, or bash output matching `/Error|FAIL|error|exception|EPERM|ENOENT/i`, emit immediate `claude-flinch` IPC event. Bypasses mood scoring — this is instant.

**Reaction** (`scene-engine.js`):
- Play **flinch** animation as a one-shot (not looping), then return to current state animation
- One-shot system: `playOneShot(animName, onComplete)` — temporarily overrides current animation, auto-reverts

**Sound** (`sounds.js`): SNES damage sound — descending square wave with noise burst. Already exists as `playFrustrated()` but should fire immediately, not wait for mood threshold.

**Emoji**: Flash 💥 in thought bubble during flinch, then revert to state emoji.

## Feature 3: Eureka Moment

**Detection** (`detector.js`): Track last N states. If 3+ consecutive `researching` states followed by `coding` or `bash` → emit `claude-eureka`.

**Reaction** (`scene-engine.js`):
- Play **eureka** animation as a one-shot
- Flash 💡 emoji in thought bubble

**Visuals** (`mood-effects.js`): Brief gold/white particle burst (sparkle effect, 15 particles, 0.5s duration).

**Sound** (`sounds.js`): SNES "item discovered" jingle — ascending major arpeggio with triangle + square, short (0.5s).

## Feature 4: Lo-fi SNES Coding Music

**Implementation** (`sounds.js`): Procedural 8-bar loop, Chrono Trigger shop style:
- **Melody**: Triangle wave, pentatonic scale (C D E G A), gentle quarter/eighth notes
- **Chords**: Square wave pad, whole notes, very low volume (0.1), basic I-IV-V-I progression
- **Bass**: Triangle wave, root notes on beats 1 and 3
- **Tempo**: ~90 BPM, relaxed
- **Loop**: ~12 seconds, seamless repeat

**Behavior**:
- Starts after 10 seconds of sustained `coding` state
- Fades in over 2 seconds (volume ramp)
- Fades out over 1 second on state change
- Coding click sounds continue layered underneath (reduced volume during music)
- Volume respects global volume setting

## Feature 5: Idle Wandering

**Implementation** (`scene-engine.js`): After 15s of idle state, enter wander mode:

1. Pick a random furniture piece (excluding current position)
2. Walk to it using walking animation
3. On arrival, play random interaction animation:
   - **pushing** (50% chance) — "examining/adjusting" the furniture
   - **picking-up** (50% chance) — "inspecting" something
4. Show random curiosity emoji: 🤔 🔧 📦 ✨ 🔍 🎵
5. Pause 2–3 seconds
6. Pick another random piece, repeat

**Exit**: Any state change immediately cancels wandering, transitions to new station.

**Wander timer**: 4–8 second random delay between wander targets (so it's not frantic).

## Feature 6: Victory Celebration

**Trigger**: `celebrating` mood activates (from mood-detector.js keyword/score system).

**Reaction**:
- Play **victory** animation (front-flip) as a one-shot
- Victory fanfare plays (already implemented in sounds.js)
- Gold confetti particle effect (new in mood-effects.js): 20–30 small gold/orange particles falling with gravity + slight drift

## Extended States & Moods

### New State Mappings (detector.js TOOL_MAP)

| Tool | Current State | New State | Emoji |
|------|--------------|-----------|-------|
| WebFetch, WebSearch | researching | **browsing** | 🌐 |
| Write | coding | **building** | 🏗️ |
| Task (subagent) | thinking | **delegating** | 🫡 |

These get their own stations (reuse existing furniture but different thought emoji).

### New Moods (mood-detector.js)

| Mood | Detection | Emoji | Sound | Particles |
|------|-----------|-------|-------|-----------|
| **determined** | Error followed by immediate retry (same tool within 5s) | 💪 | Resolute ascending square (short, punchy) | Orange steady flame particles |
| **proud** | 10+ tool calls in session then idle | 🌟 | Warm major chord resolve | Gentle gold sparkles (slow, floating) |
| **curious** | 5+ research tools in a row with no edits | 🔎 | Soft mystery chime (minor 7th) | Light blue question-mark wisps |

### Extended Mood Emojis (scene-engine.js MOOD_EMOJIS)

Add to existing map:
```
determined: '💪'
proud:      '🌟'
curious:    '🔎'
```

### Station Config Updates

```javascript
// New states reuse furniture but with distinct emojis
browsing:   { furniture: 'terminal',   direction: 's',  offsetX: -30, offsetY: 40 }
building:   { furniture: 'workbench',  direction: 'se', offsetX: -30, offsetY: 40 }
delegating: { furniture: 'armchair',   direction: 'sw', offsetX: 30,  offsetY: 40 }
```

## One-Shot Animation System

New method on SceneEngine:

```javascript
playOneShot(animationKey, { emoji = null, duration = null, onComplete = null } = {})
```

- Temporarily replaces current looping animation with a single-play animation
- On completion (last frame reached), reverts to previous state animation
- Optional emoji override for thought bubble during one-shot
- Optional duration cap (auto-revert after N ms even if frames haven't completed)
- Used by: flinch, eureka, victory, idle interactions

## Files Changed

| File | Changes |
|------|---------|
| `src/detector.js` | Flow detection, error flinch event, eureka detection, new tool mappings, new state history tracking |
| `src/scene-engine.js` | One-shot animation system, idle wandering, flow-state animation, new stations, extended emoji maps |
| `src/sounds.js` | Coding music loop (procedural), eureka jingle, determined/proud/curious sounds |
| `src/mood-detector.js` | New moods (determined, proud, curious) with detection patterns |
| `src/mood-effects.js` | Flow aura + speed lines, eureka burst, victory confetti, new mood particles |
| `src/renderer.js` | Wire up new IPC events (flow, flinch, eureka), register new animations, connect new moods |
| `preload.js` | Expose new IPC channels (claude-flow, claude-flinch, claude-eureka) |
| `main.js` | Forward new detector events to renderer |
