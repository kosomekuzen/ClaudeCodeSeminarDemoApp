const http = require('http')
const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')

const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const PORT = process.env.PORT || 3939

// 許可するSkill一覧。ここに無いskill名はAPIに渡さない。
const SKILLS = new Set(['minutes', 'reply'])

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(body)
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const safeSuffix = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(PUBLIC_DIR, safeSuffix)

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

function handleRun(req, res) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
    if (body.length > 200_000) req.destroy()
  })

  req.on('end', () => {
    let payload
    try {
      payload = JSON.parse(body || '{}')
    } catch {
      sendJson(res, 400, { error: 'リクエストの形式が正しくありません' })
      return
    }

    const { skill, input } = payload
    if (typeof skill !== 'string' || !SKILLS.has(skill)) {
      sendJson(res, 400, { error: '不明な業務です' })
      return
    }
    if (typeof input !== 'string' || !input.trim()) {
      sendJson(res, 400, { error: '入力が空です' })
      return
    }

    // Claude Codeをヘッドレス実行(-p)で叩く。execFileなのでシェルを経由せず、
    // inputに何が入っていてもコマンドとして解釈されない。
    const prompt = `/${skill}\n\n${input}`
    execFile(
      'claude',
      ['-p', prompt],
      { cwd: ROOT, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          sendJson(res, 500, { error: stderr?.trim() || err.message })
          return
        }
        sendJson(res, 200, { result: stdout.trim() })
      }
    )
  })
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/run') {
    handleRun(req, res)
    return
  }
  if (req.method === 'GET') {
    serveStatic(req, res)
    return
  }
  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`AI業務ランチャー: http://localhost:${PORT}`)
})
