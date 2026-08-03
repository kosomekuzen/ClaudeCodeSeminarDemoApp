const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

const ACCENT_PRESETS = ['#1b4f91', '#2e7d32', '#7a4fa8', '#a83e3e']

const DEFAULTS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  accentColor: '#1b4f91',
  opacity: 1,
  alwaysOnTop: true,
  autoLaunch: false,
  hotkeyEnabled: false,
  rememberPosition: true,
  skipPreviewConfirm: false,
  notifyOnComplete: true,
  windowPosition: null, // { x, y } | null
  windowSize: null, // { width, height } | null
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2))
  }
}

function isValidHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function sanitize(input) {
  const out = { ...DEFAULTS }

  if (['system', 'light', 'dark'].includes(input?.theme)) out.theme = input.theme
  if (isValidHexColor(input?.accentColor)) out.accentColor = input.accentColor
  if (typeof input?.opacity === 'number' && input.opacity >= 0.5 && input.opacity <= 1) {
    out.opacity = input.opacity
  }
  ;['alwaysOnTop', 'autoLaunch', 'hotkeyEnabled', 'rememberPosition', 'skipPreviewConfirm', 'notifyOnComplete'].forEach(
    (key) => {
      if (typeof input?.[key] === 'boolean') out[key] = input[key]
    }
  )
  if (
    input?.windowPosition &&
    typeof input.windowPosition.x === 'number' &&
    typeof input.windowPosition.y === 'number'
  ) {
    out.windowPosition = { x: input.windowPosition.x, y: input.windowPosition.y }
  }
  if (
    input?.windowSize &&
    typeof input.windowSize.width === 'number' &&
    input.windowSize.width > 0 &&
    typeof input.windowSize.height === 'number' &&
    input.windowSize.height > 0
  ) {
    out.windowSize = { width: input.windowSize.width, height: input.windowSize.height }
  }

  return out
}

function readSettings() {
  ensureFile()
  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    return sanitize(parsed)
  } catch {
    return { ...DEFAULTS }
  }
}

function writeSettings(input) {
  const current = readSettings()
  const next = sanitize({ ...current, ...input })
  ensureFile()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2))
  return next
}

module.exports = { readSettings, writeSettings, ACCENT_PRESETS, DEFAULTS }
