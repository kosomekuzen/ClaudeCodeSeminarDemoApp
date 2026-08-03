const fs = require('fs')
const { execFile } = require('child_process')
const { getWorkMode, isValidHttpUrl, TARGET_KEYS } = require('./config-service')

const TYPE_OF_KEY = { urls: 'url', files: 'file', folders: 'folder' }

function buildTargetList(workMode) {
  const list = []
  TARGET_KEYS.forEach((key) => {
    ;(workMode[key] || []).forEach((entry) => {
      list.push({ key, type: TYPE_OF_KEY[key], label: entry.label, value: entry.value })
    })
  })
  return list
}

// 実行直前に毎回チェックする(登録後にファイルが移動・削除されている可能性があるため)。
function checkTarget(key, value) {
  if (key === 'urls') {
    if (!isValidHttpUrl(value)) return { ok: false, reason: '不正なURLです' }
    return { ok: true }
  }
  if (!fs.existsSync(value)) {
    return { ok: false, reason: 'ファイルが見つかりません' }
  }
  const stat = fs.statSync(value)
  if (key === 'files' && !stat.isFile()) return { ok: false, reason: 'ファイルではありません' }
  if (key === 'folders' && !stat.isDirectory()) return { ok: false, reason: 'フォルダではありません' }
  return { ok: true }
}

function preview(workModeId) {
  const workMode = getWorkMode(workModeId)
  if (!workMode) return null
  return buildTargetList(workMode).map((t) => {
    const result = checkTarget(t.key, t.value)
    return { type: t.type, label: t.label, value: t.value, willOpen: result.ok, reason: result.ok ? null : result.reason }
  })
}

// explorer.exeはシェルを経由せず、渡した文字列をそのまま1つの引数として受け取って開く。
// URL(http/https)・ファイル・フォルダのいずれもWindowsの標準関連付けで開くため、
// cmd.exeの`start`のようなシェル文字列解釈を経由しない。
function openWithOS(value) {
  return new Promise((resolve) => {
    execFile('explorer.exe', [value], { timeout: 10_000 }, (err) => {
      if (err && err.code === 'ENOENT') {
        resolve({ ok: false, reason: 'explorer.exeが見つかりません(Windows以外の環境では起動できません)' })
        return
      }
      // explorer.exeは正常に開いた場合でも0以外の終了コードを返すことがある
      // (Windowsの既知の挙動)。起動コマンド自体を発行できなかった場合のみ失敗として扱う。
      resolve({ ok: true })
    })
  })
}

async function launch(workModeId) {
  const workMode = getWorkMode(workModeId)
  if (!workMode) return null

  const targets = buildTargetList(workMode)
  const results = []
  for (const t of targets) {
    const check = checkTarget(t.key, t.value)
    if (!check.ok) {
      results.push({ type: t.type, label: t.label, value: t.value, success: false, reason: check.reason })
      continue
    }
    const opened = await openWithOS(t.value)
    results.push({ type: t.type, label: t.label, value: t.value, success: opened.ok, reason: opened.ok ? null : opened.reason })
  }
  return results
}

module.exports = { preview, launch }
