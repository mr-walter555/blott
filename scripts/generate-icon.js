// Produces assets/icon.png and assets/icon.ico

const zlib     = require('zlib')
const fs       = require('fs')
const path     = require('path')
const pngToIco = require('png-to-ico').default

const SIZE = 256
const buf  = Buffer.alloc(SIZE * SIZE * 4, 0) // RGBA

// ── Pixel helpers ─────────────────────────────────────────────────────────────

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  const sa = a / 255, da = buf[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa === 0) return
  buf[i]     = Math.round((r * sa + buf[i]     * da * (1 - sa)) / oa)
  buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa)
  buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa)
  buf[i + 3] = Math.round(oa * 255)
}

function fillCircle(cx, cy, radius, r, g, b) {
  for (let y = Math.max(0, cy - radius - 1); y <= Math.min(SIZE - 1, cy + radius + 1); y++) {
    for (let x = Math.max(0, cx - radius - 1); x <= Math.min(SIZE - 1, cx + radius + 1); x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (d <= radius - 0.5) {
        setPixel(x, y, r, g, b)
      } else if (d < radius + 0.5) {
        setPixel(x, y, r, g, b, Math.round((radius + 0.5 - d) * 255))
      }
    }
  }
}

function fillRect(x, y, w, h, r, g, b) {
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++)
      setPixel(px, py, r, g, b)
}

function fillRoundRect(x, y, w, h, radius, r, g, b) {
  fillRect(x + radius, y, w - radius * 2, h, r, g, b)
  fillRect(x, y + radius, w, h - radius * 2, r, g, b)
  fillCircle(x + radius,     y + radius,     radius, r, g, b)
  fillCircle(x + w - radius, y + radius,     radius, r, g, b)
  fillCircle(x + radius,     y + h - radius, radius, r, g, b)
  fillCircle(x + w - radius, y + h - radius, radius, r, g, b)
}

// ── Draw icon ─────────────────────────────────────────────────────────────────

// Purple circle background  (#7c3aed)
fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 124, 58, 237)

// White "S" — 5 strokes with rounded caps
// Dimensions chosen to sit well inside the circle
const W  = 92   // letter width
const H  = 134  // letter height
const T  = 22   // stroke thickness
const CR = 11   // corner radius = T/2
const LX = Math.round((SIZE - W) / 2)   // 82
const TY = Math.round((SIZE - H) / 2)   // 61
const MX = LX
const MY = TY + Math.round(H / 2) - Math.round(T / 2)  // vertical midpoint

// Top horizontal bar
fillRoundRect(LX, TY, W, T, CR, 255, 255, 255)
// Top-left vertical (top half, no top cap — merges with top bar)
fillRect(LX, TY + T, T, MY - TY - T, 255, 255, 255)
// Middle horizontal bar
fillRoundRect(LX, MY, W, T, CR, 255, 255, 255)
// Bottom-right vertical (bottom half)
fillRect(LX + W - T, MY + T, T, TY + H - T - (MY + T), 255, 255, 255)
// Bottom horizontal bar
fillRoundRect(LX, TY + H - T, W, T, CR, 255, 255, 255)

// ── PNG encoding ──────────────────────────────────────────────────────────────

function crc32(data) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF]
  return ((crc ^ 0xFFFFFFFF) >>> 0)
}

function chunk(type, data) {
  const t   = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA

const rows = []
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(1 + SIZE * 4)
  row[0] = 0
  buf.copy(row, 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  rows.push(row)
}
const compressed = zlib.deflateSync(Buffer.concat(rows))

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

// ── ICO encoding — multi-size (16, 32, 48, 256) required by rcedit ───────────

function scalePng(srcBuf, srcSize, dstSize) {
  // Nearest-neighbour downscale into a new pixel buffer → PNG
  const dst = Buffer.alloc(dstSize * dstSize * 4, 0)
  const ratio = srcSize / dstSize
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      const sx = Math.min(Math.floor(x * ratio), srcSize - 1)
      const sy = Math.min(Math.floor(y * ratio), srcSize - 1)
      const si = (sy * srcSize + sx) * 4
      const di = (y  * dstSize + x)  * 4
      dst[di] = srcBuf[si]; dst[di+1] = srcBuf[si+1]
      dst[di+2] = srcBuf[si+2]; dst[di+3] = srcBuf[si+3]
    }
  }
  // Encode as PNG
  const rows2 = []
  for (let y = 0; y < dstSize; y++) {
    const row = Buffer.alloc(1 + dstSize * 4)
    row[0] = 0
    dst.copy(row, 1, y * dstSize * 4, (y + 1) * dstSize * 4)
    rows2.push(row)
  }
  const h2 = Buffer.alloc(13)
  h2.writeUInt32BE(dstSize, 0); h2.writeUInt32BE(dstSize, 4)
  h2[8] = 8; h2[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', h2),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows2))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write files ───────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, '..', 'assets')
fs.mkdirSync(outDir, { recursive: true })

const pngPath = path.join(outDir, 'icon.png')
const icoPath = path.join(outDir, 'icon.ico')

fs.writeFileSync(pngPath, png)
console.log(`✓ assets/icon.png  (${png.length} bytes)`)

pngToIco(pngPath)
  .then(ico => {
    fs.writeFileSync(icoPath, ico)
    console.log(`✓ assets/icon.ico  (${ico.length} bytes)`)
  })
  .catch(err => console.error('ICO generation failed:', err.message))
