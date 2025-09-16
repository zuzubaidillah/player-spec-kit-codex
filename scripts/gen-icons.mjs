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
  const { raw } = makeRaw(width, height, (setPixel) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) setPixel(x, y, rgba);
    }
  });
  const idatData = zlib.deflateSync(raw);

  const png = Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return png;
}

function makeRaw(width, height, painter) {
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);
  const setPixel = (x, y, rgba) => {
    const rowStart = y * rowLen;
    if (raw[rowStart] !== 0) raw[rowStart] = 0; // filter type 0
    const p = rowStart + 1 + x * 4;
    raw[p + 0] = rgba[0];
    raw[p + 1] = rgba[1];
    raw[p + 2] = rgba[2];
    raw[p + 3] = rgba[3];
  };
  // init filter bytes
  for (let y = 0; y < height; y++) raw[y * rowLen] = 0;
  if (painter) painter(setPixel);
  return { raw, rowLen };
}

function makePNGPainted(width, height, painter) {
  const { raw } = makeRaw(width, height, painter);
  const idatData = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function writeIcon(path, width, height, rgba, painter) {
  if (Array.isArray(height)) { painter = rgba; rgba = height; height = width; }
  const w = width;
  const h = height ?? width;
  let buf;
  if (painter) {
    buf = makePNGPainted(w, h, painter);
  } else {
    buf = makePNG(w, h, rgba);
  }
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

// Local offline slides (with visible grid & label blocks)
function patterned(bg, label) {
  return (set) => {
    const W = 1280, H = 720;
    // background
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x,y,bg);
    // grid lines every 80px
    const grid = [0xcc,0xd0,0xdb,0xff];
    for (let y = 0; y < H; y+=80) for (let x=0;x<W;x++) set(x,y,grid);
    for (let x = 0; x < W; x+=80) for (let y=0;y<H;y++) set(x,y,grid);
    // label boxes
    const box = [0xff,0xff,0xff,0xff];
    const box2 = [0x0b,0x0d,0x12,0xff];
    const w = 220, h = 80; const x0 = 24, y0 = 24;
    for (let y=y0;y<y0+h;y++) for (let x=x0;x<x0+w;x++) set(x,y,box);
    // simple label bars (not text, but unique shapes)
    const bx = x0+10, by = y0+10;
    for (let y=by;y<by+20;y++) for (let x=bx;x<bx+40;x++) set(x,y,box2);
    for (let y=by;y<by+20;y++) for (let x=bx+50;x<bx+150;x++) set(x,y,box2);
    // footer bar
    for (let y=H-40;y<H-20;y++) for (let x=24;x<300;x++) set(x,y,box);
  };
}

writeIcon(slideLocal, 1280, 720, [0x12, 0x16, 0x24, 0xff], patterned([0x12,0x16,0x24,0xff]));
const slide1 = new URL('../public/slide-01.png', import.meta.url);
const slide2 = new URL('../public/slide-02.png', import.meta.url);
const slide3 = new URL('../public/slide-03.png', import.meta.url);
writeIcon(slide1, 1280, 720, [0x18, 0x22, 0x38, 0xff], patterned([0x18,0x22,0x38,0xff]));
writeIcon(slide2, 1280, 720, [0x22, 0x28, 0x3c, 0xff], patterned([0x22,0x28,0x3c,0xff]));
writeIcon(slide3, 1280, 720, [0x2a, 0x30, 0x48, 0xff], patterned([0x2a,0x30,0x48,0xff]));
