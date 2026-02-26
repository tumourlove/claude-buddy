import { _, SH, SD, SL, CL, CD, CK, EW, EP, ES, LG, SP, BG, MT, TM, TG } from '../sprites/palette.js';

// Helper: build a 32x32 frame from an array of 32 rows, each row being an array of 32 values
const flat = (rows) => rows.flat();

// ── Frame 0: Terminal shows "> _" prompt, eyes wide/excited ─────────────
const frame0 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4: eyes wide — 4px tall eyes (extra top row)
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 5: eye upper
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: pupils centered, slightly bigger
  [_,_,_,_,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: eye bottoms
  [_,_,_,_,_,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 8: stalks meet shell
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10: shell dome top
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14: shell body
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 15
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 16
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 17
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 18: shell bottom with mouth
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 19
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 20: claws reaching down toward terminal
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21: lower body
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22: claws extend down to hold terminal edges
  [_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_],
  // Row 23: claw tips grip terminal top corners
  [_,_,_,_,_,CL,CD,CL,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,CL,CD,CL,_,_,_,_,_,_],
  // Row 24: terminal top border + legs
  [_,_,_,_,_,CL,CL,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,CL,CL,_,_,_,_,_,_],
  // Row 25: terminal row 1 — "> _" prompt
  [_,_,_,_,_,_,_,TM,_,TG,_,_,TG,TG,_,_,_,TG,TG,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 26: terminal row 2 — empty
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 27: terminal row 3 — empty
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 28: terminal bottom border
  [_,_,_,_,_,_,_,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 1: Block cursor (solid TG square), eyes same ──────────────────
const frame1 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4: eyes wide
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 5
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: pupils centered, slightly bigger
  [_,_,_,_,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: eye bottoms
  [_,_,_,_,_,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 8
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 15
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 16
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 17
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 18
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 19
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 20
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22: claws extend down
  [_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_],
  // Row 23: claw tips grip terminal
  [_,_,_,_,_,CL,CD,CL,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,CL,CD,CL,_,_,_,_,_,_],
  // Row 24: terminal top border
  [_,_,_,_,_,CL,CL,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,CL,CL,_,_,_,_,_,_],
  // Row 25: terminal row 1 — "> " then block cursor (solid TG)
  [_,_,_,_,_,_,_,TM,_,TG,_,_,TG,TG,_,_,TG,TG,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 26: terminal row 2 — empty
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 27: terminal row 3 — empty
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 28: terminal bottom border
  [_,_,_,_,_,_,_,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 2: Output lines, eyes looking down at terminal ────────────────
const frame2 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4: eyes wide
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 5: eye whites
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: eyes — pupils looking down (pupils at bottom)
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: pupils at bottom of eyes
  [_,_,_,_,_,_,_,_,_,_,EP,EP,EW,_,_,_,_,_,EP,EP,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 8
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 15
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 16
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 17
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 18
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 19
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 20
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22: claws extend down
  [_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_],
  // Row 23: claw tips grip terminal
  [_,_,_,_,_,CL,CD,CL,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,CL,CD,CL,_,_,_,_,_,_],
  // Row 24: terminal top border
  [_,_,_,_,_,CL,CL,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,CL,CL,_,_,_,_,_,_],
  // Row 25: terminal row 1 — output dots/dashes line 1
  [_,_,_,_,_,_,_,TM,_,TG,TG,_,TG,TG,TG,_,TG,_,TG,TG,_,TG,_,_,TM,_,_,_,_,_,_,_],
  // Row 26: terminal row 2 — output dots/dashes line 2
  [_,_,_,_,_,_,_,TM,_,TG,_,TG,_,_,TG,TG,_,TG,TG,_,TG,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 27: terminal row 3 — output dots/dashes line 3
  [_,_,_,_,_,_,_,TM,_,_,TG,TG,TG,_,TG,_,_,TG,_,TG,TG,TG,_,_,TM,_,_,_,_,_,_,_],
  // Row 28: terminal bottom border
  [_,_,_,_,_,_,_,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 3: Checkmark on terminal, happy eyes, sparkle above ───────────
const frame3 = flat([
  // Row 0: sparkle above
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1: sparkle arms
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,SP,SP,SP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,SP,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4: happy eyes — wide arcs (squint-smile shape)
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 5: happy eyes — curved happy expression
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: happy eyes — pupils visible, wide
  [_,_,_,_,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: happy eye bottoms — curved up (happy squint)
  [_,_,_,_,_,_,_,_,_,_,EW,EW,_,_,_,_,_,_,_,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 8
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 15
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 16
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 17
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 18
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 19
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,MT,MT,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 20
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22: claws extend down
  [_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,_,_,_,_,_,_],
  // Row 23: claw tips grip terminal
  [_,_,_,_,_,CL,CD,CL,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,CL,CD,CL,_,_,_,_,_,_],
  // Row 24: terminal top border
  [_,_,_,_,_,CL,CL,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,CL,CL,_,_,_,_,_,_],
  // Row 25: terminal row 1 — checkmark top: small tick rising right
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,_,TG,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 26: terminal row 2 — checkmark middle
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,_,_,_,_,_,_,TG,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 27: terminal row 3 — checkmark bottom-left
  [_,_,_,_,_,_,_,TM,_,_,_,_,_,TG,_,_,_,TG,_,_,_,_,_,_,TM,_,_,_,_,_,_,_],
  // Row 28: terminal bottom border + checkmark tail
  [_,_,_,_,_,_,_,TM,TM,TM,TM,TM,TM,TM,TG,TM,TM,TM,TM,TM,TM,TM,TM,TM,TM,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

export const bash = {
  fps: 5,
  frames: [frame0, frame1, frame2, frame3],
};
