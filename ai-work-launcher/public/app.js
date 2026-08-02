const TASKS = [
  {
    id: 'minutes',
    label: '会議メモ整理',
    description: '雑多な会議メモを議事録に整形します',
    placeholder:
      '会議メモを貼り付けてください\n例)\n・A社の件、進捗確認。〆切は来週金曜\n・田中さんが資料を作る、まだ着手してない\n・次回MTGは火曜10時',
  },
  {
    id: 'reply',
    label: 'メール返信作成',
    description: '受け取ったメールから返信の下書きを作ります',
    placeholder: '元のメール本文(+ 返信で伝えたい要点があれば)を貼り付けてください',
  },
]

const HISTORY_KEY = 'ai-work-launcher-history'
const HISTORY_LIMIT = 50

const els = {
  taskCards: document.getElementById('task-cards'),
  taskForm: document.getElementById('task-form'),
  taskFormTitle: document.getElementById('task-form-title'),
  taskInput: document.getElementById('task-input'),
  runButton: document.getElementById('run-button'),
  runStatus: document.getElementById('run-status'),
  resultBox: document.getElementById('result-box'),
  resultContent: document.getElementById('result-content'),
  copyButton: document.getElementById('copy-button'),
  downloadButton: document.getElementById('download-button'),
  historyList: document.getElementById('history-list'),
  historyEmpty: document.getElementById('history-empty'),
  clearHistoryButton: document.getElementById('clear-history-button'),
}

let selectedTaskId = null
let currentResult = null // { taskId, taskLabel, input, result, createdAt }

function getTask(id) {
  return TASKS.find((t) => t.id === id)
}

// ---- 業務カード ----

function renderTaskCards() {
  els.taskCards.innerHTML = ''
  TASKS.forEach((task) => {
    const card = document.createElement('button')
    card.type = 'button'
    card.className = 'task-card' + (task.id === selectedTaskId ? ' is-selected' : '')
    card.addEventListener('click', () => selectTask(task.id))

    const title = document.createElement('div')
    title.className = 'task-card-title'
    title.textContent = task.label

    const desc = document.createElement('div')
    desc.className = 'task-card-desc'
    desc.textContent = task.description

    card.append(title, desc)
    els.taskCards.appendChild(card)
  })
}

function selectTask(taskId) {
  selectedTaskId = taskId
  const task = getTask(taskId)
  renderTaskCards()

  els.taskForm.hidden = false
  els.taskFormTitle.textContent = task.label
  els.taskInput.value = ''
  els.taskInput.placeholder = task.placeholder
  els.resultBox.hidden = true
  els.runStatus.textContent = ''
  els.runStatus.classList.remove('is-error')
  currentResult = null
  els.taskInput.focus()
}

// ---- 実行 ----

async function runTask() {
  const task = getTask(selectedTaskId)
  const input = els.taskInput.value.trim()
  if (!input) {
    els.runStatus.textContent = '入力してください'
    els.runStatus.classList.add('is-error')
    return
  }

  els.runButton.disabled = true
  els.runStatus.textContent = '処理中…(10〜30秒ほどかかります)'
  els.runStatus.classList.remove('is-error')
  els.resultBox.hidden = true

  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: task.id, input }),
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || '実行に失敗しました')
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskId: task.id,
      taskLabel: task.label,
      input,
      result: data.result,
      createdAt: Date.now(),
    }

    showResult(entry)
    addHistoryEntry(entry)
    els.runStatus.textContent = '完了しました'
  } catch (err) {
    els.runStatus.textContent = err.message || '実行に失敗しました'
    els.runStatus.classList.add('is-error')
  } finally {
    els.runButton.disabled = false
  }
}

function showResult(entry) {
  currentResult = entry
  els.resultBox.hidden = false
  els.resultContent.innerHTML = ''
  els.resultContent.appendChild(renderMarkdownLite(entry.result))
}

// ---- 簡易Markdownレンダラー(安全のため常にtextContent経由でテキストを挿入する) ----

function appendInline(parent, text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  parts.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const strong = document.createElement('strong')
      strong.textContent = part.slice(2, -2)
      parent.appendChild(strong)
    } else if (part) {
      parent.appendChild(document.createTextNode(part))
    }
  })
}

function renderMarkdownLite(text) {
  const container = document.createElement('div')
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  let paragraphBuffer = []

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return
    const p = document.createElement('p')
    paragraphBuffer.forEach((line, idx) => {
      if (idx > 0) p.appendChild(document.createElement('br'))
      appendInline(p, line)
    })
    container.appendChild(p)
    paragraphBuffer = []
  }

  while (i < lines.length) {
    const line = lines[i]

    if (/^##\s+/.test(line)) {
      flushParagraph()
      const h = document.createElement('h3')
      h.textContent = line.replace(/^##\s+/, '')
      container.appendChild(h)
      i++
      continue
    }

    if (/^-\s+/.test(line)) {
      flushParagraph()
      const ul = document.createElement('ul')
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        const li = document.createElement('li')
        appendInline(li, lines[i].replace(/^-\s+/, ''))
        ul.appendChild(li)
        i++
      }
      container.appendChild(ul)
      continue
    }

    if (/^\|.*\|$/.test(line.trim())) {
      flushParagraph()
      const tableLines = []
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim())
        i++
      }
      const table = document.createElement('table')
      tableLines.forEach((rowLine, rowIdx) => {
        const cells = rowLine.slice(1, -1).split('|').map((c) => c.trim())
        if (cells.every((c) => /^:?-+:?$/.test(c))) return
        const tr = document.createElement('tr')
        cells.forEach((cellText) => {
          const cell = document.createElement(rowIdx === 0 ? 'th' : 'td')
          appendInline(cell, cellText)
          tr.appendChild(cell)
        })
        table.appendChild(tr)
      })
      container.appendChild(table)
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      i++
      continue
    }

    paragraphBuffer.push(line)
    i++
  }
  flushParagraph()
  return container
}

// ---- コピー / ダウンロード ----

async function copyResult() {
  if (!currentResult) return
  try {
    await navigator.clipboard.writeText(currentResult.result)
    els.copyButton.textContent = 'コピーしました'
  } catch {
    els.copyButton.textContent = 'コピーに失敗しました'
  }
  setTimeout(() => {
    els.copyButton.textContent = 'コピー'
  }, 1500)
}

function downloadResult() {
  if (!currentResult) return
  const blob = new Blob([currentResult.result], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(currentResult.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, '-')
  a.href = url
  a.download = `${currentResult.taskLabel}_${stamp}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---- 実行履歴(localStorage) ----

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)))
}

function addHistoryEntry(entry) {
  const items = loadHistory()
  items.unshift(entry)
  saveHistory(items)
  renderHistory()
}

function deleteHistoryEntry(id) {
  const items = loadHistory().filter((item) => item.id !== id)
  saveHistory(items)
  renderHistory()
}

function formatTimestamp(ms) {
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function renderHistory() {
  const items = loadHistory()
  els.historyList.innerHTML = ''
  els.historyEmpty.hidden = items.length > 0

  items.forEach((item) => {
    const li = document.createElement('li')
    li.className = 'history-item'

    const top = document.createElement('div')
    top.className = 'history-item-top'
    const time = document.createElement('span')
    time.textContent = formatTimestamp(item.createdAt)
    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'history-item-delete'
    del.textContent = '削除'
    del.addEventListener('click', (e) => {
      e.stopPropagation()
      deleteHistoryEntry(item.id)
    })
    top.append(time, del)

    const label = document.createElement('div')
    label.className = 'history-item-label'
    label.textContent = item.taskLabel

    const preview = document.createElement('div')
    preview.className = 'history-item-preview'
    preview.textContent = item.input

    li.append(top, label, preview)
    li.addEventListener('click', () => {
      selectTask(item.taskId)
      els.taskInput.value = item.input
      showResult(item)
    })

    els.historyList.appendChild(li)
  })
}

function clearHistory() {
  if (!confirm('実行履歴をすべて削除します。よろしいですか？')) return
  saveHistory([])
  renderHistory()
}

// ---- 初期化 ----

els.runButton.addEventListener('click', runTask)
els.copyButton.addEventListener('click', copyResult)
els.downloadButton.addEventListener('click', downloadResult)
els.clearHistoryButton.addEventListener('click', clearHistory)

renderTaskCards()
renderHistory()
