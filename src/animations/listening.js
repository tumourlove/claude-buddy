import { _, SH, SD, SL, CL, CD, CK, EW, EP, ES, LG, SP, BG, MT } from '../sprites/palette.js';

// Helper: build a 32x32 frame from an array of 32 rows, each row being an array of 32 values
const flat = (rows) => rows.flat();

// ── Frame 0: Wide eyes (4x3), attentive look, claws normal, body neutral ──
const frame0 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2: eye stalks
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4: wide eye tops (4 wide)
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 5: wide eye middles with pupils (4x3 eye, pupils centered)
  [_,_,_,_,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: wide eye bottoms
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: stalks meet shell
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 8
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9: stalks meet shell
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10: shell dome top
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14: shell body with belly
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
  // Row 20: claws normal
  [_,_,_,_,CL,CL,_,CL,CL,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,CL,CL,_,CL,CL,_,_,_,_,_],
  // Row 21
  [_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,_],
  // Row 22: claw tips
  [_,_,_,_,CL,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,CL,_,_,_,_,_],
  // Row 23: legs
  [_,_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_,_],
  // Row 24
  [_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_],
  // Row 25
  [_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_],
  // Row 26
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 27
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 28
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 1: Lean forward — shifted 1px down, wide eyes, wider mouth ──
const frame1 = flat([
  // Row 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 2
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 3: eye stalks (shifted down 1px from frame0 row 2)
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 4
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 5: wide eye tops (4 wide)
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 6: wide eye middles with pupils
  [_,_,_,_,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,EW,EP,EP,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 7: wide eye bottoms
  [_,_,_,_,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,EW,EW,EW,EW,_,_,_,_,_,_,_,_,_,_],
  // Row 8: stalks meet shell
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 9
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 10
  [_,_,_,_,_,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,ES,ES,_,_,_,_,_,_,_,_,_,_,_],
  // Row 11: shell dome top
  [_,_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_,_],
  // Row 12
  [_,_,_,_,_,_,_,_,_,_,SL,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,_,_,_,_,_,_,_,_,_,_],
  // Row 13
  [_,_,_,_,_,_,_,_,_,SL,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 14
  [_,_,_,_,_,_,_,_,_,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 15: shell body with belly
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 16
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 17
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,BG,BG,BG,BG,BG,BG,BG,BG,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 18
  [_,_,_,_,_,_,_,_,SD,SH,SH,SH,SH,BG,BG,BG,BG,BG,BG,SH,SH,SH,SH,SD,_,_,_,_,_,_,_,_],
  // Row 19: wider mouth (MT wider by 1 on each side = 6 wide)
  [_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,MT,MT,MT,MT,MT,MT,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_],
  // Row 20: mouth bottom (wider smile)
  [_,_,_,_,_,_,_,_,_,_,SD,SH,SH,SH,MT,MT,MT,MT,SH,SH,SH,SD,_,_,_,_,_,_,_,_,_,_],
  // Row 21: claws normal
  [_,_,_,_,CL,CL,_,CL,CL,_,_,SD,SD,SH,SH,SH,SH,SH,SD,SD,_,_,CL,CL,_,CL,CL,_,_,_,_,_],
  // Row 22
  [_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,SD,SD,SD,SD,SD,SD,SD,_,_,_,CL,CD,CL,CL,CD,CL,_,_,_,_],
  // Row 23: claw tips
  [_,_,_,_,CL,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,CL,_,_,_,_,_],
  // Row 24: legs
  [_,_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_,_],
  // Row 25
  [_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_],
  // Row 26
  [_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_],
  // Row 27
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 28
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

// ── Frame 2: Nod — normal position, 3x3 eyes, pupils down, claws curled inward ──
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
  // Row 5: eye tops (3x3 normal)
  [_,_,_,_,_,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 6: eye middles — pupils looking down (centered horizontally)
  [_,_,_,_,_,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,EW,EW,EW,_,_,_,_,_,_,_,_,_,_,_],
  // Row 7: eye bottoms — pupils shifted down into bottom row
  [_,_,_,_,_,_,_,_,_,_,EW,EP,EW,_,_,_,_,_,EW,EP,EW,_,_,_,_,_,_,_,_,_,_,_],
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
  // Row 14: shell body with belly
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
  // Row 20: claws curled inward (moved 2 columns toward center)
  [_,_,_,_,_,_,CL,CL,_,CL,CL,SD,SD,SH,SH,SH,SH,SH,SD,SD,CL,CL,_,CL,CL,_,_,_,_,_,_,_],
  // Row 21: claws curled inward
  [_,_,_,_,_,CL,CD,CL,CL,CD,CL,_,SD,SD,SD,SD,SD,SD,SD,_,CL,CD,CL,CL,CD,CL,_,_,_,_,_,_],
  // Row 22: claw tips curled inward
  [_,_,_,_,_,_,CL,CL,CL,CL,_,_,_,_,_,_,_,_,_,_,_,CL,CL,CL,CL,_,_,_,_,_,_,_],
  // Row 23: legs
  [_,_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_,_],
  // Row 24
  [_,_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_,_],
  // Row 25
  [_,_,_,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,LG,_,_,LG,_,_,_,_,_,_,_,_,_],
  // Row 26
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 27
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 28
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  // Row 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]);

export const listening = {
  fps: 3,
  frames: [frame0, frame1, frame2],
};
