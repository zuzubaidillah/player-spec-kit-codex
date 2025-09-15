import fs from 'node:fs';
import zlib from 'node:zlib';

// Minimal PNG generator (RGBA, no interlace)
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

function makePNG(width, height, rgba = [11, 13, 18, 255]) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image with filter byte 0 per row
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 4;
      raw[p + 0] = rgba[0];
      raw[p + 1] = rgba[1];
      raw[p + 2] = rgba[2];
      raw[p + 3] = rgba[3];
    }
  }
  const idatData = zlib.deflateSync(raw);

  const png = Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return png;
}

function writeIcon(path, size, rgba) {
  const buf = makePNG(size, size, rgba);
  fs.writeFileSync(path, buf);
  console.log(`Wrote ${path} (${buf.length} bytes)`);
}

const out192 = new URL('../public/icon-192.png', import.meta.url);
const out512 = new URL('../public/icon-512.png', import.meta.url);
const favico = new URL('../public/favicon.ico', import.meta.url);
const slideLocal = new URL('../public/slide-offline.png', import.meta.url);

// Primary color: #0b0d12 (matching app bg)
writeIcon(out192, 192, [0x0b, 0x0d, 0x12, 0xff]);
writeIcon(out512, 512, [0x0b, 0x0d, 0x12, 0xff]);

// Favicon 32x32 (same color); use .ico extension but PNG content works in most browsers when referenced as favicon
writeIcon(favico, 32, [0x0b, 0x0d, 0x12, 0xff]);

// Local offline slide 1280x720
writeIcon(slideLocal, 1280, [0x12, 0x16, 0x24, 0xff]);
