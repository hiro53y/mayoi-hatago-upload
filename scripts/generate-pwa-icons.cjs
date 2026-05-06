const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outputDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(outputDir, { recursive: true });

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(data, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = color[3];
}

function fillCircle(data, size, cx, cy, radius, color) {
  const min = Math.floor(cx - radius);
  const max = Math.ceil(cx + radius);
  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) setPixel(data, size, x, y, color);
    }
  }
}

function fillRoundedRect(data, size, x, y, width, height, radius, color) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      const rx = px < x + radius ? x + radius : px >= x + width - radius ? x + width - radius - 1 : px;
      const ry = py < y + radius ? y + radius : py >= y + height - radius ? y + height - radius - 1 : py;
      const dx = px - rx;
      const dy = py - ry;
      if (dx * dx + dy * dy <= radius * radius) setPixel(data, size, px, py, color);
    }
  }
}

function drawIcon(size, maskable = false) {
  const data = Buffer.alloc(size * size * 4);
  fillRoundedRect(data, size, 0, 0, size, size, maskable ? 0 : Math.floor(size * 0.19), [23, 18, 15, 255]);
  fillCircle(data, size, size / 2, size * 0.48, size * 0.29, [215, 168, 75, 58]);
  fillRoundedRect(data, size, size * 0.34, size * 0.3, size * 0.32, size * 0.48, size * 0.06, [42, 64, 85, 255]);
  fillCircle(data, size, size * 0.5, size * 0.27, size * 0.08, [239, 212, 168, 255]);
  fillRoundedRect(data, size, size * 0.39, size * 0.44, size * 0.22, size * 0.27, size * 0.02, [239, 228, 210, 255]);
  fillRoundedRect(data, size, size * 0.41, size * 0.5, size * 0.18, size * 0.035, size * 0.015, [157, 52, 41, 255]);
  fillRoundedRect(data, size, size * 0.41, size * 0.58, size * 0.18, size * 0.035, size * 0.015, [157, 52, 41, 255]);
  fillRoundedRect(data, size, size * 0.26, size * 0.79, size * 0.48, size * 0.045, size * 0.02, [215, 168, 75, 255]);

  const rawRows = [];
  for (let y = 0; y < size; y += 1) {
    rawRows.push(Buffer.from([0]));
    rawRows.push(data.subarray(y * size * 4, (y + 1) * size * 4));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rawRows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(outputDir, 'icon-192.png'), drawIcon(192));
fs.writeFileSync(path.join(outputDir, 'icon-512.png'), drawIcon(512));
fs.writeFileSync(path.join(outputDir, 'icon-maskable-512.png'), drawIcon(512, true));
