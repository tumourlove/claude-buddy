import { _, SH, SD, SL, CL, CD, CK, EW, EP, ES, LG, SP, BG, MT, KB, KL } from '../sprites/palette.js';

// Helper: build a 32x32 frame from an array of 32 rows, each row being an array of 32 values
const flat = (rows) => rows.flat();

// ── Frame 0: Left claw down hitting keyboard, right claw raised, squinting eyes ──
const frame0 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2: eye stalks
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 5: squinting eyes — no top row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 6: squinting eyes — 2x1 horizontal EP lines
  [_,_,_,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,_,_,_,_],
  // Row 7: squinting eyes — no bottom row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
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
  // Row 20: shell base — right claw raised, left claw starting to go down
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,CL,CL,_,CL,CL,_,_,_,_,_],
  // Row 21: left claw extending down, right claw raised with detail
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,_],
  // Row 22: left claw reaching keyboard level, right claw tip up
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,CL,_,_,_,_,_],
  // Row 23: legs + left claw reaching down
  [_,_,_,_,_,CL,CL,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_,_],
  // Row 24: left claw detail at keyboard level
  [_,_,_,CL,CD,CL,CL,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_],
  // Row 25: left claw tip touching keyboard
  [_,_,_,_,CL,CL,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_],
  // Row 26: keyboard top row with keys
  [_,_,_,_,_,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,_,_,_,_,_],
  // Row 27: keyboard body
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 28: keyboard bottom
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 1: Right claw down hitting keyboard, left claw raised, squinting eyes ──
const frame1 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2: eye stalks
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 5: squinting eyes — no top row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 6: squinting eyes — 2x1 horizontal EP lines
  [_,_,_,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,_,_,_,_],
  // Row 7: squinting eyes — no bottom row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
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
  // Row 20: shell base — left claw raised, right claw starting to go down
  [_,_,_,_,CL,CL,_,CL,CL,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21: right claw extending down, left claw raised with detail
  [_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22: right claw reaching keyboard level, left claw tip up
  [_,_,_,_,CL,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 23: legs + right claw reaching down
  [_,_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,CL,CL,_,_,_,_,_],
  // Row 24: right claw detail at keyboard level
  [_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,CL,CL,CD,CL,_,_,_,_],
  // Row 25: right claw tip touching keyboard
  [_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,CL,CL,_,_,_,_],
  // Row 26: keyboard top row with keys
  [_,_,_,_,_,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,_,_,_,_,_],
  // Row 27: keyboard body
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 28: keyboard bottom
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 2: Both claws hitting keyboard, sparks flying, squinting eyes ──
const frame2 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2: eye stalks
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 5: squinting eyes — no top row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 6: squinting eyes — 2x1 horizontal EP lines
  [_,_,_,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,EP,EP,_,_,_,_,_,_,_,_,_,_,_],
  // Row 7: squinting eyes — no bottom row
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
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
  // Row 20: shell base — both claws going down
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 23: legs + both claws reaching down
  [_,_,_,_,_,CL,CL,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,CL,CL,_,_,_,_,_],
  // Row 24: both claws at keyboard level
  [_,_,_,CL,CD,CL,CL,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,CL,CL,CD,CL,_,_,_,_],
  // Row 25: claw tips on keyboard + sparks above
  [_,_,_,_,CL,CL,_,SP,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,SP,_,_,CL,CL,_,_,_,_],
  // Row 26: keyboard top row with keys + sparks
  [_,_,_,_,_,SP,KL,KL,_,KL,KL,_,KL,KL,SP,KL,KL,SP,KL,KL,_,KL,KL,_,KL,KL,SP,_,_,_,_,_],
  // Row 27: keyboard body
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 28: keyboard bottom
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 3: Quick glance up — normal eyes, claws resting on keyboard, happy ──
const frame3 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2: eye stalks
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 5: normal eyes — full 3x3 with top row
  [_,_,_,_,_,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 6: eyes with pupils centered
  [_,_,_,_,_,_,_,_,_,_,EW,EP,EW,_,_,_,_,_,EW,EP,EW,_,_,_,_,_,_,_,_,_,_,_],
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
  // Row 18: shell bottom with happy mouth (wider)
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,MT,MT,MT,MT,MT,MT,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 19
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 20: shell base — both claws going down to rest on keyboard
  [_,_,_,_,_,_,_,_,_,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 21
  [_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 22
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 23: legs + both claws resting down
  [_,_,_,_,_,CL,CL,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,CL,CL,_,_,_,_,_],
  // Row 24: both claws resting at keyboard level
  [_,_,_,CL,CD,CL,CL,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,CL,CL,CD,CL,_,_,_,_],
  // Row 25: claw tips resting on keyboard
  [_,_,_,_,CL,CL,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,CL,CL,_,_,_,_],
  // Row 26: keyboard top row with keys
  [_,_,_,_,_,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,KL,KL,_,_,_,_,_,_],
  // Row 27: keyboard body
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 28: keyboard bottom
  [_,_,_,_,_,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,KB,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

export const coding = {
  fps: 6,
  frames: [frame0, frame1, frame2, frame3],
};
