// Generate 256x256 app icon PNG (green circle)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(r, g, b, size) {
  const width = size;
  const height = size;
  const centerX = (size - 1) / 2;
  const centerY = (size - 1) / 2;
  const radius = size / 2 - 2;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius - 1) {
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
        rawData[px + 3] = 255;
      } else if (dist <= radius + 1) {
        const alpha = Math.round(Math.max(0, Math.min(255, (radius + 1 - dist) * 127.5)));
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
        rawData[px + 3] = alpha;
      } else {
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
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

const outDir = path.join(__dirname, '..', 'assets');
fs.writeFileSync(path.join(outDir, 'icon.png'), createPNG(76, 175, 80, 256));
console.log('App icon (256x256) generated.');
