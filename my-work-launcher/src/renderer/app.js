const TARGET_TYPES = [
  { key: 'urls', containerId: 'urls-rows', valuePlaceholder: 'https://example.com', labelPlaceholder: '表示名(例: 告知ページ)' },
  { key: 'files', containerId: 'files-rows', valuePlaceholder: 'C:\\Work\\slides.pptx', labelPlaceholder: '表示名(例: 投影資料)' },
  { key: 'folders', containerId: 'folders-rows', valuePlaceholder: 'C:\\Work\\assets', labelPlaceholder: '表示名(例: 素材)' },
]

const TYPE_LABEL_JA = { url: 'URL', file: 'ファイル', folder: 'フォルダ' }

const els = {
  hideButton: document.getElementById('hide-button'),
  minimizeButton: document.getElementById('minimize-button'),
  views: {
    dashboard: document.getElementById('view-dashboard'),
    edit: document.getElementById('view-edit'),
    preview: document.getElementById('view-preview'),
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
}

let editingId = null // null = 新規登録
let previewModeId = null

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
    startBtn.addEventListener('click', () => openPreview(mode.id, mode.name))

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

function renderPreviewRows(rows) {
  els.previewRows.innerHTML = ''
  rows.forEach((r) => {
    const tr = document.createElement('tr')

    const typeTd = document.createElement('td')
    typeTd.textContent = TYPE_LABEL_JA[r.type] || r.type

    const labelTd = document.createElement('td')
    labelTd.className = 'label-cell'
    labelTd.textContent = r.label
    labelTd.title = r.value

    const statusTd = document.createElement('td')
    statusTd.textContent = r.statusText
    statusTd.className = r.ok ? 'status-ok' : 'status-ng'

    tr.append(typeTd, labelTd, statusTd)
    els.previewRows.appendChild(tr)
  })
}

els.launchButton.addEventListener('click', async () => {
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
})

// ---- 初期化 ----

loadDashboard()
