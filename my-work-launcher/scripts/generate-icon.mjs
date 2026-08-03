// トレイ・ウィンドウ・デスクトップショートカット用のプレースホルダーアイコンを生成する。
// 依存パッケージなしで、単色角丸スクエアのPNG(build/icon.png)と、
// デスクトップショートカットのアイコンに使うICO(build/icon.ico、複数解像度のPNGを内包)を直接組み立てる。
// 本物のロゴに差し替えたい場合は build/icon.png / build/icon.ico を直接置き換えればよい。
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const ICO_SIZES = [16, 32, 48, 256]
const WINDOW_ICON_SIZE = 256
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

function makePng(size) {
  const radius = Math.round(size * 0.1875)

  function insideRoundedSquare(x, y) {
    const cx = Math.min(Math.max(x, radius), size - 1 - radius)
    const cy = Math.min(Math.max(y, radius), size - 1 - radius)
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= radius * radius
  }

  const rowBytes = size * 4
  const raw = Buffer.alloc((rowBytes + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // フィルタなし
    for (let x = 0; x < size; x++) {
      const off = rowStart + 1 + x * 4
      const inside = insideRoundedSquare(x, y)
      raw[off] = COLOR[0]
      raw[off + 1] = COLOR[1]
      raw[off + 2] = COLOR[2]
      raw[off + 3] = inside ? COLOR[3] : 0
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ICO(Vista以降): 各エントリの画像データにPNGをそのまま格納できる。BMPへの変換は不要。
function makeIco(sizes) {
  const pngs = sizes.map((size) => ({ size, data: makePng(size) }))

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 = icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = 6 + pngs.length * 16
  const entries = []
  const dataParts = []
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1) // height (0 = 256)
    entry.writeUInt8(0, 2) // color count
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8) // size of image data
    entry.writeUInt32LE(offset, 12) // offset of image data
    entries.push(entry)
    dataParts.push(data)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...dataParts])
}

writeFileSync(new URL('../build/icon.png', import.meta.url), makePng(WINDOW_ICON_SIZE))
console.log('build/icon.png を生成しました')

writeFileSync(new URL('../build/icon.ico', import.meta.url), makeIco(ICO_SIZES))
console.log('build/icon.ico を生成しました(デスクトップショートカット用)')
