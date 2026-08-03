const fs = require('fs')
const { shell } = require('electron')
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

const OPEN_TIMEOUT_MS = 10_000

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Electronのshellモジュール経由で開く。cmd.exeやPowerShellを一切経由しない
// (shell.openExternalはOSのURLハンドラ、shell.openPathはOSのファイル関連付けを直接呼ぶ)。
// 手製でexplorer.exeをexecFileしていた実装より、成功/失敗の判定も素直に取れる。
// ただしshell.openPathはOS側にハンドラが無い等の状況で解決しないまま固まることがあるため、
// タイムアウトを必ず設けて「1件詰まると残り全部が起動しない」事態を避ける。
async function openWithOS(type, value) {
  if (type === 'url') {
    const result = await withTimeout(
      shell.openExternal(value).then(() => ({ ok: true })).catch(() => ({ ok: false, reason: 'URLを開けませんでした' })),
      OPEN_TIMEOUT_MS
    )
    if (result.timedOut) return { ok: false, reason: '起動がタイムアウトしました' }
    return result
  }

  // shell.openPathは例外を投げず、失敗時は空でないエラー文字列を返す
  const result = await withTimeout(shell.openPath(value), OPEN_TIMEOUT_MS)
  if (result && result.timedOut) return { ok: false, reason: '起動がタイムアウトしました' }
  if (result) return { ok: false, reason: `開けませんでした(${result})` }
  return { ok: true }
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
    const opened = await openWithOS(t.type, t.value)
    results.push({ type: t.type, label: t.label, value: t.value, success: opened.ok, reason: opened.ok ? null : opened.reason })
  }
  return results
}

module.exports = { preview, launch }
