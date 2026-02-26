// Mood overlays — sparse pixel patches stamped on top of base activity animations
// Each mood: { fps, frames: [ Array<{x, y, color}> ] }

const AN = '#ff3333';  // angry red
const SW = '#88ccff';  // sweat blue
const QM = '#ffaa00';  // question mark
const ZZ = '#aaaacc';  // zzz gray
const ST = '#ffee44';  // star yellow
const SP = '#ffd700';  // sparkle gold
const ES = '#2c2c4a';  // eyelid (stalk color)
const HM = '#ff6644';  // happy mouth

export const frustrated = {
  fps: 3,
  frames: [
    // Frame 0: angry eyebrows + sweat drop high
    [
      { x: 9, y: 4, color: AN }, { x: 10, y: 3, color: AN },
      { x: 12, y: 4, color: AN }, { x: 13, y: 3, color: AN },
      { x: 19, y: 3, color: AN }, { x: 20, y: 4, color: AN },
      { x: 18, y: 3, color: AN }, { x: 21, y: 4, color: AN },
      { x: 7, y: 6, color: SW }, { x: 7, y: 7, color: SW },
    ],
    // Frame 1: eyebrows + sweat drop fallen
    [
      { x: 9, y: 4, color: AN }, { x: 10, y: 3, color: AN },
      { x: 12, y: 4, color: AN }, { x: 13, y: 3, color: AN },
      { x: 19, y: 3, color: AN }, { x: 20, y: 4, color: AN },
      { x: 18, y: 3, color: AN }, { x: 21, y: 4, color: AN },
      { x: 7, y: 9, color: SW }, { x: 7, y: 10, color: SW },
    ],
  ],
};

export const celebrating = {
  fps: 4,
  frames: [
    [
      { x: 5, y: 3, color: SP }, { x: 26, y: 8, color: SP },
      { x: 15, y: 0, color: ST }, { x: 16, y: 0, color: ST },
      { x: 14, y: 18, color: HM }, { x: 15, y: 18, color: HM },
      { x: 16, y: 18, color: HM }, { x: 17, y: 18, color: HM },
    ],
    [
      { x: 7, y: 1, color: ST }, { x: 24, y: 5, color: SP },
      { x: 3, y: 10, color: SP }, { x: 28, y: 12, color: ST },
      { x: 14, y: 18, color: HM }, { x: 15, y: 18, color: HM },
      { x: 16, y: 18, color: HM }, { x: 17, y: 18, color: HM },
    ],
    [
      { x: 27, y: 2, color: SP }, { x: 4, y: 7, color: ST },
      { x: 16, y: 1, color: SP }, { x: 2, y: 14, color: ST },
      { x: 14, y: 18, color: HM }, { x: 15, y: 18, color: HM },
      { x: 16, y: 18, color: HM }, { x: 17, y: 18, color: HM },
    ],
  ],
};

export const confused = {
  fps: 2,
  frames: [
    // Question mark above head + swapped pupil color
    [
      { x: 15, y: 0, color: QM }, { x: 16, y: 0, color: QM },
      { x: 16, y: 1, color: QM },
      { x: 15, y: 2, color: QM },
      { x: 15, y: 4, color: QM },
      { x: 11, y: 6, color: QM }, { x: 20, y: 6, color: QM },
    ],
    // Question mark faded (only top)
    [
      { x: 15, y: 0, color: QM }, { x: 16, y: 0, color: QM },
      { x: 16, y: 1, color: QM },
    ],
  ],
};

export const excited = {
  fps: 5,
  frames: [
    [
      { x: 6, y: 2, color: ST }, { x: 25, y: 4, color: ST },
      { x: 3, y: 12, color: SP }, { x: 28, y: 10, color: SP },
    ],
    [
      { x: 28, y: 1, color: ST }, { x: 4, y: 6, color: ST },
      { x: 27, y: 14, color: SP }, { x: 2, y: 8, color: SP },
    ],
    [
      { x: 7, y: 0, color: SP }, { x: 25, y: 10, color: ST },
      { x: 2, y: 8, color: ST }, { x: 29, y: 6, color: SP },
    ],
  ],
};

export const sleepy = {
  fps: 2,
  frames: [
    // Half-closed eyelids + small z
    [
      { x: 10, y: 5, color: ES }, { x: 11, y: 5, color: ES }, { x: 12, y: 5, color: ES },
      { x: 19, y: 5, color: ES }, { x: 20, y: 5, color: ES }, { x: 21, y: 5, color: ES },
      { x: 24, y: 2, color: ZZ }, { x: 25, y: 2, color: ZZ },
      { x: 24, y: 3, color: ZZ },
      { x: 24, y: 4, color: ZZ }, { x: 25, y: 4, color: ZZ },
    ],
    // Eyelids + bigger Z shifted up
    [
      { x: 10, y: 5, color: ES }, { x: 11, y: 5, color: ES }, { x: 12, y: 5, color: ES },
      { x: 19, y: 5, color: ES }, { x: 20, y: 5, color: ES }, { x: 21, y: 5, color: ES },
      { x: 25, y: 0, color: ZZ }, { x: 26, y: 0, color: ZZ }, { x: 27, y: 0, color: ZZ },
      { x: 26, y: 1, color: ZZ },
      { x: 25, y: 2, color: ZZ }, { x: 26, y: 2, color: ZZ }, { x: 27, y: 2, color: ZZ },
    ],
    // Eyelids only (zzz blink)
    [
      { x: 10, y: 5, color: ES }, { x: 11, y: 5, color: ES }, { x: 12, y: 5, color: ES },
      { x: 19, y: 5, color: ES }, { x: 20, y: 5, color: ES }, { x: 21, y: 5, color: ES },
    ],
  ],
};
