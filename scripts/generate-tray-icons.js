// Generate 16x16 tray icon PNGs (green circle for connected, red for disconnected)
// Uses raw PNG encoding - no dependencies needed

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(r, g, b) {
  const width = 16;
  const height = 16;
  const centerX = 7.5;
  const centerY = 7.5;
  const radius = 6;

  // Build raw RGBA pixel data with filter byte per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius - 0.5) {
        // Fully inside
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
        rawData[px + 3] = 255;
      } else if (dist <= radius + 0.5) {
        // Anti-aliased edge
        const alpha = Math.round((radius + 0.5 - dist) * 255);
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
        rawData[px + 3] = alpha;
      } else {
        // Outside - transparent
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const outDir = path.join(__dirname, '..', 'assets', 'tray');
fs.mkdirSync(outDir, { recursive: true });

// Green circle (connected)
fs.writeFileSync(path.join(outDir, 'connected.png'), createPNG(76, 175, 80));
// Red circle (disconnected)
fs.writeFileSync(path.join(outDir, 'disconnected.png'), createPNG(244, 67, 54));

console.log('Tray icons generated successfully.');
