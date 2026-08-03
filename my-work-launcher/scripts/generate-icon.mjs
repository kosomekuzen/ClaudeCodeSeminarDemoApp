// トレイ・ウィンドウ用のプレースホルダーアイコンを生成する。
// 依存パッケージなしで、単色角丸スクエアのPNGを直接組み立てる。
// 本物のロゴに差し替えたい場合は build/icon.png を直接置き換えればよい。
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const SIZE = 256
const RADIUS = 48
const COLOR = [37, 99, 235, 255] // #2563eb

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function insideRoundedSquare(x, y) {
  const cx = Math.min(Math.max(x, RADIUS), SIZE - 1 - RADIUS)
  const cy = Math.min(Math.max(y, RADIUS), SIZE - 1 - RADIUS)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= RADIUS * RADIUS
}

const rowBytes = SIZE * 4
const raw = Buffer.alloc((rowBytes + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (rowBytes + 1)
  raw[rowStart] = 0 // フィルタなし
  for (let x = 0; x < SIZE; x++) {
    const off = rowStart + 1 + x * 4
    const inside = insideRoundedSquare(x, y)
    raw[off] = COLOR[0]
    raw[off + 1] = COLOR[1]
    raw[off + 2] = COLOR[2]
    raw[off + 3] = inside ? COLOR[3] : 0
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type: RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const idat = deflateSync(raw)

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync(new URL('../build/icon.png', import.meta.url), png)
console.log('build/icon.png を生成しました')
