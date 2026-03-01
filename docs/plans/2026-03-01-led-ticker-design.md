# LED Ticker Tape Display — Design

## Overview
Add a retro LED dot-matrix ticker tape display mounted on the right wall of CLAWD's isometric room. The ticker scrolls funny state-specific messages that describe what CLAWD/Claude is doing.

## Visual Style
- **Retro LED dot-matrix strip** — bright colored dots on dark background panel
- Mounted on the right wall, aligned to the isometric angle via `ctx.setTransform()`
- Positioned in the upper-middle area of the right wall (avoids furniture overlap)
- Subtle glow/bloom effect on LED text
- Text color could shift based on mood (amber default, red frustrated, green celebrating, etc.)

## Scrolling Behavior
- **Continuous right-to-left scroll** along the wall's isometric axis
- Smooth pixel-by-pixel movement, ~30-40px/sec
- When a message finishes scrolling off, the next one enters
- On state change, current message finishes, new state message queues next

## Message Pools (per state, randomly selected, no repeats until exhausted)

| State | Messages |
|-------|----------|
| coding | HACKING THE MAINFRAME, TYPING FURIOUSLY, DEPLOYING BUTTERFLIES, MOVING PIXELS AROUND, COPY PASTE ENGINEERING, ARTISANAL CODE CRAFTING |
| researching | PONTIFICATING, CONSULTING THE ORACLE, READING ANCIENT SCROLLS, GOOGLING INTENSELY, ABSORBING KNOWLEDGE, SPEED READING |
| bash | SUMMONING DEMONS, RUNNING WITH SCISSORS, POKING THE BEAR, sudo MAKE ME A SANDWICH, EXECUTING ORDER 66, PERMISSION DENIED LOL |
| thinking | LOADING THOUGHTS..., BRAIN.EXE RUNNING, CONTEMPLATING EXISTENCE, BUFFERING..., COGITATING VIGOROUSLY, PROCESSING... |
| listening | AWAITING ORDERS, ALL EARS, YES BOSS?, STANDING BY, READY FOR INPUT, AT YOUR SERVICE |
| idle | ZZZ, POWER SAVING MODE, SCREEN SAVER ACTIVE, ON BREAK, DO NOT DISTURB, AFK |
| browsing | SURFING THE WEB, DOOM SCROLLING, DOWNLOADING MORE RAM, CLICKING LINKS, INCOGNITO MODE |
| building | CONSTRUCTING PYLONS, LAYING BRICKS, ASSEMBLING IKEA CODE, BUILDING CHARACTER, SOME ASSEMBLY REQUIRED |
| delegating | PASSING THE BUCK, DELEGATING RESPONSIBILITY, OUTSOURCING, MIDDLE MANAGEMENT, HERDING CATS |

## Implementation

### Where
- New `_drawTicker()` method in `src/scene-engine.js`
- Called during room drawing, after right wall but before furniture/character
- Ticker state (scroll position, current message, queue) managed in SceneEngine

### How
- `ctx.setTransform()` to skew text onto the right wall's isometric plane
- Canvas `fillText` for the LED text, clipped to ticker panel bounds
- Piggybacks on existing state change IPC — no new channels needed
- Message selection on state change via existing `setState()` path

### What it doesn't do
- No new IPC channels
- No preferences (always visible when room is shown)
- No sound effects for the ticker
