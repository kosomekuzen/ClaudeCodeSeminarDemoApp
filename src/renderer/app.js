// valuePlaceholderはOSによって変わるため、設定読み込み時(applyPathExamples)に上書きする。
const TARGET_TYPES = [
  { key: 'urls', containerId: 'urls-rows', valuePlaceholder: 'https://example.com', labelPlaceholder: '表示名(例: 告知ページ)' },
  { key: 'files', containerId: 'files-rows', valuePlaceholder: 'C:\\Work\\slides.pptx', labelPlaceholder: '表示名(例: 投影資料)' },
  { key: 'folders', containerId: 'folders-rows', valuePlaceholder: 'C:\\Work\\assets', labelPlaceholder: '表示名(例: 素材)' },
]

const TYPE_LABEL_JA = { url: 'URL', file: 'ファイル', folder: 'フォルダ' }

const els = {
  hideButton: document.getElementById('hide-button'),
  minimizeButton: document.getElementById('minimize-button'),
  settingsButton: document.getElementById('settings-button'),
  views: {
    dashboard: document.getElementById('view-dashboard'),
    edit: document.getElementById('view-edit'),
    preview: document.getElementById('view-preview'),
    settings: document.getElementById('view-settings'),
  },
  modeCards: document.getElementById('mode-cards'),
  modeEmpty: document.getElementById('mode-empty'),
  addModeButton: document.getElementById('add-mode-button'),
  editTitle: document.getElementById('edit-title'),
  modeName: document.getElementById('mode-name'),
  editErrors: document.getElementById('edit-errors'),
  saveModeButton: document.getElementById('save-mode-button'),
  previewTitle: document.getElementById('preview-title'),
  previewRows: document.getElementById('preview-rows'),
  launchButton: document.getElementById('launch-button'),
  launchStatus: document.getElementById('launch-status'),
  themeSelect: document.getElementById('setting-theme'),
  accentColors: document.getElementById('setting-accent-colors'),
  opacityInput: document.getElementById('setting-opacity'),
  opacityValue: document.getElementById('setting-opacity-value'),
  alwaysOnTop: document.getElementById('setting-always-on-top'),
  autoLaunch: document.getElementById('setting-auto-launch'),
  hotkey: document.getElementById('setting-hotkey'),
  hotkeyDesc: document.getElementById('hotkey-desc'),
  rememberPosition: document.getElementById('setting-remember-position'),
  skipPreview: document.getElementById('setting-skip-preview'),
  notify: document.getElementById('setting-notify'),
  exportButton: document.getElementById('export-data-button'),
  importButton: document.getElementById('import-data-button'),
  dataStatus: document.getElementById('data-status'),
}

let editingId = null // null = 新規登録
let previewModeId = null
let currentSettings = null

// ---- 画面切り替え ----

function showView(name) {
  Object.entries(els.views).forEach(([key, el]) => {
    el.hidden = key !== name
  })
}

document.querySelectorAll('[data-action="back-to-dashboard"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    showView('dashboard')
    loadDashboard()
  })
})

els.hideButton.addEventListener('click', () => window.launcherAPI.hideWindow())
els.minimizeButton.addEventListener('click', () => window.launcherAPI.minimizeWindow())
els.settingsButton.addEventListener('click', () => showView('settings'))

// ---- ダッシュボード ----

async function loadDashboard() {
  const workModes = await window.launcherAPI.listWorkModes()
  els.modeCards.innerHTML = ''
  els.modeEmpty.hidden = workModes.length > 0

  workModes.forEach((mode) => {
    const count = (mode.urls?.length || 0) + (mode.files?.length || 0) + (mode.folders?.length || 0)

    const card = document.createElement('div')
    card.className = 'mode-card'

    const name = document.createElement('div')
    name.className = 'mode-card-name'
    name.textContent = mode.name

    const countEl = document.createElement('div')
    countEl.className = 'mode-card-count'
    countEl.textContent = `登録 ${count}件`

    const actions = document.createElement('div')
    actions.className = 'mode-card-actions'

    const startBtn = document.createElement('button')
    startBtn.type = 'button'
    startBtn.className = 'primary'
    startBtn.textContent = '開始'
    startBtn.addEventListener('click', async () => {
      await openPreview(mode.id, mode.name)
      if (currentSettings?.skipPreviewConfirm) {
        launchCurrentPreview()
      }
    })

    const editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.className = 'ghost-button'
    editBtn.textContent = '編集'
    editBtn.addEventListener('click', () => openEdit(mode))

    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.className = 'ghost-button'
    deleteBtn.textContent = '削除'
    deleteBtn.addEventListener('click', () => deleteMode(mode.id, mode.name))

    actions.append(startBtn, editBtn, deleteBtn)
    card.append(name, countEl, actions)
    els.modeCards.appendChild(card)
  })
}

async function deleteMode(id, name) {
  if (!confirm(`「${name}」を削除します。よろしいですか？`)) return
  await window.launcherAPI.deleteWorkMode(id)
  loadDashboard()
}

// ---- 登録・編集 ----

function makeRow(type, entry) {
  const typeDef = TARGET_TYPES.find((t) => t.key === type)
  const row = document.createElement('div')
  row.className = 'target-row'

  const inputs = document.createElement('div')
  inputs.className = 'row-inputs'

  const labelInput = document.createElement('input')
  labelInput.type = 'text'
  labelInput.placeholder = typeDef.labelPlaceholder
  labelInput.value = entry?.label || ''
  labelInput.dataset.field = 'label'

  const valueInput = document.createElement('input')
  valueInput.type = 'text'
  valueInput.placeholder = typeDef.valuePlaceholder
  valueInput.value = entry?.value || ''
  valueInput.dataset.field = 'value'

  inputs.append(labelInput, valueInput)

  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.className = 'remove-row'
  removeBtn.textContent = '削除'
  removeBtn.addEventListener('click', () => row.remove())

  row.append(inputs, removeBtn)
  return row
}

function addRow(type, entry) {
  const typeDef = TARGET_TYPES.find((t) => t.key === type)
  document.getElementById(typeDef.containerId).appendChild(makeRow(type, entry))
}

document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', () => addRow(btn.dataset.add))
})

function clearEditForm() {
  els.modeName.value = ''
  TARGET_TYPES.forEach((t) => {
    document.getElementById(t.containerId).innerHTML = ''
  })
  els.editErrors.hidden = true
  els.editErrors.innerHTML = ''
}

function openEdit(mode) {
  clearEditForm()
  editingId = mode ? mode.id : null
  els.editTitle.textContent = mode ? '業務モードを編集' : '業務モードを追加'

  if (mode) {
    els.modeName.value = mode.name
    TARGET_TYPES.forEach((t) => {
      ;(mode[t.key] || []).forEach((entry) => addRow(t.key, entry))
    })
  }
  showView('edit')
}

els.addModeButton.addEventListener('click', () => openEdit(null))

function collectRows(type) {
  const typeDef = TARGET_TYPES.find((t) => t.key === type)
  const rows = document.querySelectorAll(`#${typeDef.containerId} .target-row`)
  return Array.from(rows)
    .map((row) => ({
      label: row.querySelector('[data-field="label"]').value.trim(),
      value: row.querySelector('[data-field="value"]').value.trim(),
    }))
    .filter((e) => e.label || e.value)
}

async function saveMode() {
  const payload = {
    name: els.modeName.value.trim(),
    urls: collectRows('urls'),
    files: collectRows('files'),
    folders: collectRows('folders'),
  }

  const result = editingId
    ? await window.launcherAPI.updateWorkMode(editingId, payload)
    : await window.launcherAPI.createWorkMode(payload)

  if (result.errors) {
    els.editErrors.innerHTML = ''
    result.errors.forEach((m) => {
      const li = document.createElement('li')
      li.textContent = m
      els.editErrors.appendChild(li)
    })
    els.editErrors.hidden = false
    return
  }

  showView('dashboard')
  loadDashboard()
}

els.saveModeButton.addEventListener('click', saveMode)

// ---- 起動確認・結果 ----

async function openPreview(id, name) {
  previewModeId = id
  els.previewTitle.textContent = `起動確認: ${name}`
  els.launchStatus.textContent = ''
  els.launchStatus.classList.remove('is-error')
  els.launchButton.disabled = false

  const targets = await window.launcherAPI.previewWorkMode(id)
  renderPreviewRows(
    targets.map((t) => ({ ...t, statusText: t.willOpen ? '開けます' : t.reason, ok: t.willOpen }))
  )
  showView('preview')
}

// 開くと「表示」ではなく「実行」されうる拡張子。ブロックはせず、確認画面で目立たせる。
const EXECUTABLE_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.hta', '.msi', '.reg',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.lnk', '.url',
  '.command', '.sh', '.app', '.tool',
]

function isExecutableTarget(row) {
  if (row.type !== 'file') return false
  const value = String(row.value || '').toLowerCase()
  return EXECUTABLE_EXTENSIONS.some((ext) => value.endsWith(ext))
}

function renderPreviewRows(rows) {
  els.previewRows.innerHTML = ''
  rows.forEach((r) => {
    const tr = document.createElement('tr')

    const typeTd = document.createElement('td')
    typeTd.textContent = TYPE_LABEL_JA[r.type] || r.type

    const labelTd = document.createElement('td')
    labelTd.className = 'label-cell'
    labelTd.textContent = r.label

    // 実際に開くURL/パスを必ず画面に出す。表示名は自由に付けられるため、
    // 表示名だけを見せると「何を開こうとしているのか」を確認できない。
    const valueTd = document.createElement('td')
    valueTd.className = 'value-cell'
    valueTd.textContent = r.value
    valueTd.title = r.value
    if (isExecutableTarget(r)) {
      valueTd.appendChild(document.createTextNode(' '))
      const warn = document.createElement('span')
      warn.className = 'exec-warning'
      warn.textContent = '実行ファイル'
      valueTd.appendChild(warn)
    }

    const statusTd = document.createElement('td')
    statusTd.textContent = r.statusText
    statusTd.className = r.ok ? 'status-ok' : 'status-ng'

    tr.append(typeTd, labelTd, valueTd, statusTd)
    els.previewRows.appendChild(tr)
  })
}

async function launchCurrentPreview() {
  if (!previewModeId) return
  els.launchButton.disabled = true
  els.launchStatus.textContent = '起動しています…'
  els.launchStatus.classList.remove('is-error')

  const results = await window.launcherAPI.launchWorkMode(previewModeId)
  renderPreviewRows(
    results.map((r) => ({ ...r, statusText: r.success ? '開きました' : r.reason, ok: r.success }))
  )
  const failCount = results.filter((r) => !r.success).length
  els.launchStatus.textContent = failCount > 0 ? `完了(${failCount}件失敗)` : '完了しました'
  if (failCount > 0) els.launchStatus.classList.add('is-error')
  els.launchButton.disabled = false
}

els.launchButton.addEventListener('click', launchCurrentPreview)

// ---- 設定 ----

function mixHex(hex, amount, towards) {
  const num = parseInt(hex.slice(1), 16)
  const rgb = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
  const mixed = rgb.map((c, i) => Math.round(c + (towards[i] - c) * amount))
  return `#${mixed.map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('')}`
}

function applyThemeToDocument(isDark) {
  document.body.dataset.theme = isDark ? 'dark' : 'light'
  if (currentSettings) applyAccentToDocument(currentSettings.accentColor)
}

function applyAccentToDocument(color) {
  const isDark = document.body.dataset.theme === 'dark'
  const hover = isDark ? mixHex(color, 0.3, [255, 255, 255]) : mixHex(color, 0.3, [0, 0, 0])
  document.body.style.setProperty('--accent', color)
  document.body.style.setProperty('--accent-hover', hover)
}

function renderAccentSwatches(presets, selected) {
  els.accentColors.innerHTML = ''
  presets.forEach((color) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'color-swatch' + (color === selected ? ' is-selected' : '')
    btn.style.background = color
    btn.title = color
    btn.addEventListener('click', () => updateSetting({ accentColor: color }))
    els.accentColors.appendChild(btn)
  })
}

// 入力欄の例示テキストはOS(Windows/macOS)によって変わるため、メインプロセスの値で上書きする。
function applyPathExamples(pathExample) {
  if (!pathExample) return
  const byKey = { files: pathExample.file, folders: pathExample.folder }
  TARGET_TYPES.forEach((t) => {
    if (!byKey[t.key]) return
    t.valuePlaceholder = byKey[t.key]
    document
      .querySelectorAll(`#${t.containerId} input[data-field="value"]`)
      .forEach((input) => { input.placeholder = byKey[t.key] })
  })
}

function populateSettingsForm(settings) {
  els.themeSelect.value = settings.theme
  els.opacityInput.value = settings.opacity
  els.opacityValue.textContent = `${Math.round(settings.opacity * 100)}%`
  els.alwaysOnTop.checked = settings.alwaysOnTop
  els.autoLaunch.checked = settings.autoLaunch
  els.hotkey.checked = settings.hotkeyEnabled
  els.rememberPosition.checked = settings.rememberPosition
  els.skipPreview.checked = settings.skipPreviewConfirm
  els.notify.checked = settings.notifyOnComplete
  renderAccentSwatches(settings.accentPresets || [], settings.accentColor)

  if (settings.hotkeyLabel) els.hotkeyDesc.textContent = settings.hotkeyLabel
  // 他のアプリに先に取られている場合、オンにしても実際には効かないのでその旨を出す。
  if (settings.hotkeyEnabled && settings.hotkeyRegistered === false) {
    els.hotkeyDesc.textContent = `${settings.hotkeyLabel} — 他のアプリが使用中のため登録できませんでした`
    els.hotkeyDesc.classList.add('is-error')
  } else {
    els.hotkeyDesc.classList.remove('is-error')
  }
}

async function loadSettings() {
  const settings = await window.launcherAPI.getSettings()
  currentSettings = settings
  applyThemeToDocument(settings.isDark)
  applyAccentToDocument(settings.accentColor)
  applyPathExamples(settings.pathExample)
  populateSettingsForm(settings)
}

async function updateSetting(partial) {
  const settings = await window.launcherAPI.updateSettings(partial)
  currentSettings = settings
  applyThemeToDocument(settings.isDark)
  applyAccentToDocument(settings.accentColor)
  applyPathExamples(settings.pathExample)
  populateSettingsForm(settings)
}

els.themeSelect.addEventListener('change', () => updateSetting({ theme: els.themeSelect.value }))

els.opacityInput.addEventListener('input', () => {
  els.opacityValue.textContent = `${Math.round(els.opacityInput.value * 100)}%`
})
els.opacityInput.addEventListener('change', () => {
  updateSetting({ opacity: Number(els.opacityInput.value) })
})

els.alwaysOnTop.addEventListener('change', () => updateSetting({ alwaysOnTop: els.alwaysOnTop.checked }))
els.autoLaunch.addEventListener('change', () => updateSetting({ autoLaunch: els.autoLaunch.checked }))
els.hotkey.addEventListener('change', () => updateSetting({ hotkeyEnabled: els.hotkey.checked }))
els.rememberPosition.addEventListener('change', () =>
  updateSetting({ rememberPosition: els.rememberPosition.checked })
)
els.skipPreview.addEventListener('change', () => updateSetting({ skipPreviewConfirm: els.skipPreview.checked }))
els.notify.addEventListener('change', () => updateSetting({ notifyOnComplete: els.notify.checked }))

els.exportButton.addEventListener('click', async () => {
  const result = await window.launcherAPI.exportData()
  if (result.canceled) return
  els.dataStatus.textContent = `書き出しました: ${result.filePath}`
  els.dataStatus.classList.remove('is-error')
})

els.importButton.addEventListener('click', async () => {
  const result = await window.launcherAPI.importData()
  if (result.canceled) return
  if (result.errors?.length) {
    els.dataStatus.textContent = result.errors.join(' / ')
    els.dataStatus.classList.add('is-error')
    return
  }
  // 何が追加されたのかを名前で示す。実際に開く対象は起動確認画面で全件確認できる。
  const names = (result.importedNames || []).join('、')
  els.dataStatus.textContent = names
    ? `${result.importedCount}件を読み込みました: ${names}(開く対象は「開始」時の確認画面で確認できます)`
    : `${result.importedCount}件の業務モードを読み込みました`
  els.dataStatus.classList.remove('is-error')
  loadDashboard()
})

window.launcherAPI.onThemeChanged(({ isDark }) => applyThemeToDocument(isDark))

// ---- 初期化 ----

loadDashboard()
loadSettings()
