# Chalkboard Task List — Design

## Summary

Add a classic green chalkboard to the left wall of the isometric room that displays Claude Code's current task list. Tasks appear as a checkbox-style list with strikethrough on completed items.

## Data Flow

```
JSONL logs → detector.js parses TaskCreate/TaskUpdate tool_use blocks
  → extracts {id, subject, status} → maintains task map
  → IPC 'claude-tasks' sends full task list to renderer
  → SceneEngine renders on left wall chalkboard panel
```

## Components

### 1. Detector — Task Parsing (`src/detector.js`)

- Parse `TaskCreate` tool_use blocks: extract `input.subject`, `input.description`, assign sequential ID
- Parse `TaskUpdate` tool_use blocks: extract `input.taskId`, `input.status`, `input.subject` (if updated)
- Maintain `this.tasks = new Map()` mapping taskId → `{subject, status}`
- New callback: `this.onTasks` — fires with full task array on every change
- `TaskCreate`/`TaskUpdate` do NOT change character state (not added to TOOL_MAP)
- Reset tasks when a new JSONL file appears (new session)

### 2. IPC Channel (`main.js`, `preload.js`)

- New channel: `claude-tasks`
- Sends: `[{id, subject, status}]` array
- Preload exposes: `onTasksChange(callback)`

### 3. Scene Rendering (`src/scene-engine.js`)

#### Chalkboard Panel Geometry

- Position: left wall, to the LEFT of the existing starry night window
- Window occupies ~30%-65% horizontal extent → chalkboard at ~5%-28%
- Same vertical range as window: ~25%-70% of wall height
- Precompute as `CHALK_PANEL` module constant (like `TICKER_PANEL`)
- Left wall direction vectors: `dx = left.x - top.x`, `dy = left.y - top.y` (opposite to right wall)

#### Visual Style

- **Background**: Dark green fill (`#2a4a2a`) — classic chalkboard
- **Frame**: Wooden border (`#8b6914` / `#6b4f12`) — thin 1-2px
- **Text**: White chalk (`rgba(255, 255, 255, 0.85)`) with slight opacity variation
- **Font**: ~7-8px monospace, chalk-style appearance
- **Checkboxes**: `☐` pending/in_progress, `☑` completed (or simple squares)
- **Strikethrough**: Chalk line drawn through completed task text (slightly wavy for charm)

#### Isometric Transform

Same pattern as ticker but for left wall:
```js
// Left wall unit vectors
const leftWallDx = left.x - top.x;  // negative (going left)
const leftWallDy = left.y - top.y;  // positive (going down)
const leftWallLen = Math.sqrt(leftWallDx² + leftWallDy²);
const lux = leftWallDx / leftWallLen;
const luy = leftWallDy / leftWallLen;

ctx.transform(lux, luy, 0, 1, 0, 0);  // Skew text along left wall
```

#### Layout

- No header — maximize space for task items
- ~4-6 task lines visible depending on font size
- Completed tasks sink to bottom of list
- If more tasks than fit, show most recent pending first, then recent completed
- Each line: `☐ Task subject...` or `☑ ~~Task subject...~~`
- Truncate long subjects with `…`

### 4. New Method: `setTasks(tasks)`

- Called from renderer when `claude-tasks` IPC fires
- Stores task array on engine instance
- Triggers redraw (tasks render each frame in `_drawChalkboard()`)

## Rendering Order

Chalkboard draws as part of the left wall (after wall fill, before/alongside window):
1. Left wall fill + stroke
2. Chalkboard panel (background, frame, text)
3. Window (starry night)
4. Wall detail lines

## File Changes

| File | Change |
|------|--------|
| `src/detector.js` | Parse TaskCreate/TaskUpdate, maintain task map, onTasks callback |
| `main.js` | Wire `detector.onTasks` → IPC `claude-tasks` |
| `preload.js` | Expose `onTasksChange` listener |
| `src/renderer.js` | Listen for `claude-tasks`, call `engine.setTasks()` |
| `src/scene-engine.js` | `CHALK_PANEL` constant, `_drawChalkboard()` method, `setTasks()` method |
