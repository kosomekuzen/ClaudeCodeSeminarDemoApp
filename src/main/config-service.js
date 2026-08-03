const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'work-modes.json')

const TARGET_KEYS = ['urls', 'files', 'folders']
const TARGET_LABELS = { urls: 'URL', files: 'ファイル', folders: 'フォルダ' }

function labelFor(key) {
  return TARGET_LABELS[key] || key
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ version: 1, workModes: [] }, null, 2))
  }
}

function readAll() {
  ensureDataFile()
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    if (!Array.isArray(parsed.workModes)) throw new Error('invalid shape')
    return parsed
  } catch {
    return { version: 1, workModes: [] }
  }
}

function writeAll(data) {
  ensureDataFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function listWorkModes() {
  return readAll().workModes
}

function getWorkMode(id) {
  return readAll().workModes.find((m) => m.id === id) || null
}

// ---- バリデーション ----

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isAbsolutePath(value) {
  return path.isAbsolute(value) || /^[a-zA-Z]:[\\/]/.test(value)
}

function validateEntry(type, entry) {
  if (!entry || typeof entry.label !== 'string' || !entry.label.trim()) {
    return 'ラベルを入力してください'
  }
  if (typeof entry.value !== 'string' || !entry.value.trim()) {
    return '値を入力してください'
  }

  if (type === 'urls') {
    if (!isValidHttpUrl(entry.value)) return 'URLはhttp://またはhttps://で始まる形式で入力してください'
    return null
  }

  if (!isAbsolutePath(entry.value)) {
    return '絶対パスで入力してください(例: C:\\Work\\slides.pptx)'
  }
  if (!fs.existsSync(entry.value)) {
    return `パスが見つかりません: ${entry.value}`
  }
  const stat = fs.statSync(entry.value)
  if (type === 'files' && !stat.isFile()) return 'ファイルではありません'
  if (type === 'folders' && !stat.isDirectory()) return 'フォルダではありません'
  return null
}

function validateWorkMode(input) {
  const errors = []
  if (!input || typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('業務モード名を入力してください')
  }
  TARGET_KEYS.forEach((key) => {
    const list = Array.isArray(input?.[key]) ? input[key] : []
    list.forEach((entry, idx) => {
      const err = validateEntry(key, entry)
      if (err) errors.push(`${labelFor(key)} ${idx + 1}件目: ${err}`)
    })
  })
  return errors
}

function sanitizeTargets(input) {
  const out = {}
  TARGET_KEYS.forEach((key) => {
    const list = Array.isArray(input?.[key]) ? input[key] : []
    out[key] = list
      .filter((e) => e && String(e.label || '').trim() && String(e.value || '').trim())
      .map((e) => ({ label: String(e.label).trim(), value: String(e.value).trim() }))
  })
  return out
}

// ---- CRUD ----

function createWorkMode(input) {
  const errors = validateWorkMode(input)
  if (errors.length) return { errors }

  const data = readAll()
  const workMode = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    ...sanitizeTargets(input),
  }
  data.workModes.push(workMode)
  writeAll(data)
  return { workMode }
}

function updateWorkMode(id, input) {
  const errors = validateWorkMode(input)
  if (errors.length) return { errors }

  const data = readAll()
  const idx = data.workModes.findIndex((m) => m.id === id)
  if (idx === -1) return { errors: ['業務モードが見つかりません'] }

  data.workModes[idx] = {
    id,
    name: input.name.trim(),
    ...sanitizeTargets(input),
  }
  writeAll(data)
  return { workMode: data.workModes[idx] }
}

function deleteWorkMode(id) {
  const data = readAll()
  const next = data.workModes.filter((m) => m.id !== id)
  const deleted = next.length !== data.workModes.length
  data.workModes = next
  writeAll(data)
  return deleted
}

module.exports = {
  TARGET_KEYS,
  labelFor,
  isValidHttpUrl,
  listWorkModes,
  getWorkMode,
  createWorkMode,
  updateWorkMode,
  deleteWorkMode,
}
