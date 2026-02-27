/**
 * Generate simple steampunk furniture PNGs using raw PNG encoding.
 * These are functional placeholders until PixelLab downloads work.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA data (width * height * 4)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crc32Table[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  const crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crc32Table[n] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - add filter byte (0) before each row
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter none
    pixels.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw);

  // IEND
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), iend]);
}

function setPixel(buf, w, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= w || y < 0 || y >= buf.length / (w * 4)) return;
  const i = (y * w + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
}

function fillRect(buf, w, x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      setPixel(buf, w, x, y, r, g, b, a);
}

function drawOutline(buf, w, x1, y1, x2, y2, r, g, b) {
  for (let x = x1; x <= x2; x++) { setPixel(buf, w, x, y1, r, g, b); setPixel(buf, w, x, y2, r, g, b); }
  for (let y = y1; y <= y2; y++) { setPixel(buf, w, x1, y, r, g, b); setPixel(buf, w, x2, y, r, g, b); }
}

// Colors - steampunk palette
const DARK_WOOD = [80, 50, 30];
const MED_WOOD = [120, 75, 45];
const LIGHT_WOOD = [160, 105, 60];
const BRASS = [185, 155, 55];
const DARK_BRASS = [140, 115, 40];
const COPPER = [180, 100, 50];
const DARK_METAL = [60, 55, 50];
const LEATHER = [130, 70, 40];
const DARK_LEATHER = [90, 50, 30];
const GREEN_GLOW = [80, 200, 120];
const BOOK_RED = [150, 40, 40];
const BOOK_GREEN = [40, 100, 50];
const BOOK_BLUE = [40, 60, 140];

function generateWorkbench() {
  const w = 128, h = 128;
  const buf = Buffer.alloc(w * h * 4); // all transparent

  // Table top (isometric-ish)
  fillRect(buf, w, 20, 55, 108, 62, ...MED_WOOD);
  fillRect(buf, w, 22, 56, 106, 61, ...LIGHT_WOOD);
  drawOutline(buf, w, 20, 55, 108, 62, ...DARK_WOOD);

  // Table front face
  fillRect(buf, w, 20, 63, 108, 90, ...MED_WOOD);
  drawOutline(buf, w, 20, 63, 108, 90, ...DARK_WOOD);
  // Drawers
  fillRect(buf, w, 24, 66, 50, 78, ...DARK_WOOD);
  drawOutline(buf, w, 24, 66, 50, 78, ...DARK_WOOD);
  setPixel(buf, w, 37, 72, ...BRASS);
  fillRect(buf, w, 24, 80, 50, 88, ...DARK_WOOD);
  drawOutline(buf, w, 24, 80, 50, 88, ...DARK_WOOD);
  setPixel(buf, w, 37, 84, ...BRASS);

  // Legs
  fillRect(buf, w, 22, 91, 26, 105, ...DARK_WOOD);
  fillRect(buf, w, 104, 91, 108, 105, ...DARK_WOOD);

  // Items on desk: typewriter shape
  fillRect(buf, w, 60, 44, 86, 54, ...DARK_METAL);
  drawOutline(buf, w, 60, 44, 86, 54, ...DARK_METAL);
  fillRect(buf, w, 63, 40, 83, 44, ...DARK_METAL);
  // Paper
  fillRect(buf, w, 65, 36, 81, 40, 220, 210, 190);

  // Lamp
  fillRect(buf, w, 96, 38, 100, 54, ...BRASS);
  fillRect(buf, w, 92, 30, 104, 38, ...COPPER);
  fillRect(buf, w, 94, 32, 102, 36, 255, 220, 100, 200);

  // Gears on desk
  setPixel(buf, w, 30, 52, ...BRASS);
  setPixel(buf, w, 32, 50, ...BRASS);
  setPixel(buf, w, 34, 53, ...DARK_BRASS);

  return createPNG(w, h, buf);
}

function generateBookshelf() {
  const w = 96, h = 96;
  const buf = Buffer.alloc(w * h * 4);

  // Main frame
  fillRect(buf, w, 15, 10, 80, 85, ...MED_WOOD);
  drawOutline(buf, w, 15, 10, 80, 85, ...DARK_WOOD);

  // Shelves
  for (let sy of [10, 28, 46, 64]) {
    fillRect(buf, w, 16, sy, 79, sy + 2, ...DARK_WOOD);
  }

  // Books on shelves
  const bookColors = [BOOK_RED, BOOK_GREEN, BOOK_BLUE, LEATHER, DARK_BRASS];
  for (let shelf = 0; shelf < 3; shelf++) {
    const shelfY = 13 + shelf * 18;
    let bx = 19;
    for (let b = 0; b < 8; b++) {
      const color = bookColors[(shelf * 3 + b) % bookColors.length];
      const bw = 3 + Math.floor(Math.random() * 3);
      const bh = 12 + Math.floor(Math.random() * 4);
      fillRect(buf, w, bx, shelfY + (16 - bh), bx + bw, shelfY + 15, ...color);
      bx += bw + 1;
      if (bx > 75) break;
    }
  }

  // Brass magnifying glass on top
  drawOutline(buf, w, 40, 3, 48, 8, ...BRASS);
  fillRect(buf, w, 44, 8, 46, 12, ...DARK_BRASS);

  // Top decorative trim
  fillRect(buf, w, 15, 8, 80, 10, ...DARK_BRASS);

  return createPNG(w, h, buf);
}

function generateTerminal() {
  const w = 96, h = 96;
  const buf = Buffer.alloc(w * h * 4);

  // Console body
  fillRect(buf, w, 20, 25, 76, 80, ...DARK_METAL);
  drawOutline(buf, w, 20, 25, 76, 80, ...DARK_WOOD);

  // Screen
  fillRect(buf, w, 28, 30, 68, 55, 20, 30, 20);
  drawOutline(buf, w, 27, 29, 69, 56, ...BRASS);
  // Green text lines
  for (let line = 0; line < 5; line++) {
    const lw = 15 + Math.floor(Math.random() * 20);
    fillRect(buf, w, 30, 33 + line * 4, 30 + lw, 34 + line * 4, ...GREEN_GLOW);
  }
  // Cursor blink
  fillRect(buf, w, 30, 53, 33, 54, ...GREEN_GLOW);

  // Pressure gauges
  drawOutline(buf, w, 30, 60, 38, 68, ...BRASS);
  setPixel(buf, w, 34, 64, 200, 50, 50); // needle
  drawOutline(buf, w, 58, 60, 66, 68, ...BRASS);
  setPixel(buf, w, 62, 64, 50, 200, 50);

  // Levers
  fillRect(buf, w, 44, 60, 46, 70, ...DARK_BRASS);
  fillRect(buf, w, 43, 58, 47, 60, ...BRASS);
  fillRect(buf, w, 50, 62, 52, 70, ...DARK_BRASS);
  fillRect(buf, w, 49, 60, 53, 62, ...BRASS);

  // Brass rivets
  for (let rx of [24, 72]) for (let ry of [28, 50, 75]) setPixel(buf, w, rx, ry, ...BRASS);

  // Legs
  fillRect(buf, w, 24, 80, 28, 90, ...DARK_METAL);
  fillRect(buf, w, 68, 80, 72, 90, ...DARK_METAL);

  return createPNG(w, h, buf);
}

function generateArmchair() {
  const w = 80, h = 80;
  const buf = Buffer.alloc(w * h * 4);

  // Seat cushion
  fillRect(buf, w, 15, 40, 65, 55, ...LEATHER);
  drawOutline(buf, w, 15, 40, 65, 55, ...DARK_LEATHER);

  // Back rest
  fillRect(buf, w, 15, 18, 65, 40, ...LEATHER);
  drawOutline(buf, w, 15, 18, 65, 40, ...DARK_LEATHER);
  // Tufting
  for (let tx of [28, 40, 52]) for (let ty of [24, 33]) setPixel(buf, w, tx, ty, ...DARK_LEATHER);

  // Armrests
  fillRect(buf, w, 8, 35, 15, 55, ...LEATHER);
  drawOutline(buf, w, 8, 35, 15, 55, ...DARK_LEATHER);
  fillRect(buf, w, 65, 35, 72, 55, ...LEATHER);
  drawOutline(buf, w, 65, 35, 72, 55, ...DARK_LEATHER);

  // Brass rivets on armrests
  for (let ry of [38, 42, 46, 50]) {
    setPixel(buf, w, 9, ry, ...BRASS);
    setPixel(buf, w, 71, ry, ...BRASS);
  }

  // Brass frame accents
  fillRect(buf, w, 15, 17, 65, 18, ...BRASS);

  // Legs
  fillRect(buf, w, 12, 56, 16, 68, ...DARK_BRASS);
  fillRect(buf, w, 64, 56, 68, 68, ...DARK_BRASS);

  return createPNG(w, h, buf);
}

function generateStool() {
  const w = 48, h = 48;
  const buf = Buffer.alloc(w * h * 4);

  // Seat (circular-ish)
  fillRect(buf, w, 12, 14, 36, 22, ...LEATHER);
  fillRect(buf, w, 14, 12, 34, 24, ...LEATHER);
  drawOutline(buf, w, 12, 14, 36, 22, ...DARK_BRASS);
  drawOutline(buf, w, 14, 12, 34, 24, ...DARK_BRASS);
  // Brass rim
  setPixel(buf, w, 13, 13, ...BRASS); setPixel(buf, w, 35, 13, ...BRASS);
  setPixel(buf, w, 13, 23, ...BRASS); setPixel(buf, w, 35, 23, ...BRASS);

  // Gear-shaped legs (simplified)
  // Center pole
  fillRect(buf, w, 22, 24, 26, 36, ...DARK_BRASS);
  // Three legs spreading out
  for (let lx of [12, 22, 32]) {
    fillRect(buf, w, lx, 36, lx + 4, 42, ...DARK_BRASS);
    fillRect(buf, w, lx + 1, 42, lx + 3, 44, ...DARK_METAL);
  }
  // Small gear at joint
  drawOutline(buf, w, 20, 28, 28, 32, ...BRASS);

  return createPNG(w, h, buf);
}

function generateHammock() {
  const w = 112, h = 112;
  const buf = Buffer.alloc(w * h * 4);

  // Left post
  fillRect(buf, w, 15, 20, 19, 85, ...DARK_BRASS);
  fillRect(buf, w, 12, 15, 22, 22, ...BRASS); // ornate top
  fillRect(buf, w, 10, 82, 24, 88, ...DARK_METAL); // base

  // Right post
  fillRect(buf, w, 90, 20, 94, 85, ...DARK_BRASS);
  fillRect(buf, w, 87, 15, 97, 22, ...BRASS);
  fillRect(buf, w, 85, 82, 99, 88, ...DARK_METAL);

  // Hammock chains
  for (let i = 0; i < 12; i++) {
    setPixel(buf, w, 20 + i * 2, 22 + i, ...DARK_METAL);
    setPixel(buf, w, 89 - i * 2, 22 + i, ...DARK_METAL);
  }

  // Hammock fabric (sagging curve)
  for (let x = 30; x <= 78; x++) {
    const t = (x - 30) / 48;
    const sag = Math.sin(t * Math.PI) * 15;
    const y = Math.round(40 + sag);
    fillRect(buf, w, x, y - 2, x, y + 2, ...LEATHER);
    fillRect(buf, w, x, y - 1, x, y + 1, ...MED_WOOD);
  }

  // Pillow
  fillRect(buf, w, 34, 42, 48, 50, 180, 160, 140);
  drawOutline(buf, w, 34, 42, 48, 50, ...DARK_LEATHER);

  return createPNG(w, h, buf);
}

function generateWallBackground() {
  const w = 384, h = 384;
  const buf = Buffer.alloc(w * h * 4);

  // Metal panel background
  fillRect(buf, w, 0, 0, 383, 200, 70, 65, 60);

  // Riveted panels
  for (let px = 0; px < 384; px += 64) {
    drawOutline(buf, w, px, 0, px + 63, 200, 55, 50, 45);
    // Rivets in corners
    for (let rx of [px + 4, px + 59]) {
      for (let ry of [4, 100, 196]) {
        setPixel(buf, w, rx, ry, ...BRASS);
        setPixel(buf, w, rx + 1, ry, ...DARK_BRASS);
      }
    }
  }

  // Horizontal pipes
  for (let py of [30, 80, 150]) {
    fillRect(buf, w, 0, py, 383, py + 8, ...COPPER);
    fillRect(buf, w, 0, py + 1, 383, py + 3, 200, 120, 70); // highlight
    drawOutline(buf, w, 0, py, 383, py + 8, ...DARK_METAL);
    // Pipe joints
    for (let jx = 60; jx < 384; jx += 80) {
      fillRect(buf, w, jx, py - 2, jx + 12, py + 10, ...DARK_BRASS);
      drawOutline(buf, w, jx, py - 2, jx + 12, py + 10, ...DARK_METAL);
    }
  }

  // Vertical pipe
  fillRect(buf, w, 320, 0, 328, 200, ...COPPER);
  fillRect(buf, w, 320, 1, 324, 200, 200, 120, 70);

  // Large gear decoration
  const gx = 190, gy = 120;
  for (let a = 0; a < 360; a += 5) {
    const rad = a * Math.PI / 180;
    const r = 25 + ((a % 30 < 15) ? 5 : 0);
    const px = Math.round(gx + Math.cos(rad) * r);
    const py = Math.round(gy + Math.sin(rad) * r);
    setPixel(buf, w, px, py, ...BRASS);
  }
  // Inner circle
  for (let a = 0; a < 360; a += 8) {
    const rad = a * Math.PI / 180;
    const px = Math.round(gx + Math.cos(rad) * 12);
    const py = Math.round(gy + Math.sin(rad) * 12);
    setPixel(buf, w, px, py, ...DARK_BRASS);
  }

  // Steam vents (small rectangles with brightness)
  for (let vx of [50, 280]) {
    fillRect(buf, w, vx, 170, vx + 20, 180, ...DARK_METAL);
    drawOutline(buf, w, vx, 170, vx + 20, 180, ...BRASS);
    // Vent slats
    for (let s = 0; s < 4; s++) {
      fillRect(buf, w, vx + 2, 172 + s * 2, vx + 18, 172 + s * 2, 90, 85, 80);
    }
  }

  // Floor area (below wall) - dark wood planks
  for (let y = 201; y < 384; y++) {
    for (let x = 0; x < 384; x++) {
      const plank = Math.floor(x / 32);
      const shade = (plank % 2 === 0) ? 0 : 10;
      setPixel(buf, w, x, y, 65 + shade, 45 + shade, 30 + shade);
    }
  }
  // Plank lines
  for (let px = 0; px < 384; px += 32) {
    for (let y = 201; y < 384; y++) setPixel(buf, w, px, y, 45, 30, 20);
  }
  // Brass nails in floor
  for (let px = 16; px < 384; px += 32) {
    for (let py = 220; py < 384; py += 40) {
      setPixel(buf, w, px, py, ...BRASS);
    }
  }

  return createPNG(w, h, buf);
}

// Generate all assets
const outDir = path.join(__dirname, '..', 'assets', 'scene');

const assets = {
  'workbench.png': generateWorkbench,
  'bookshelf.png': generateBookshelf,
  'terminal.png': generateTerminal,
  'armchair.png': generateArmchair,
  'stool.png': generateStool,
  'hammock.png': generateHammock,
  'wall-background.png': generateWallBackground,
};

for (const [name, gen] of Object.entries(assets)) {
  const png = gen();
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(`Generated ${name} (${png.length} bytes)`);
}

console.log('Done! All furniture assets generated.');
