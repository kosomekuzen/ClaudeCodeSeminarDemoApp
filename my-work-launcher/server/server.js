const express = require('express')
const path = require('path')
const configService = require('./config-service')
const launcherService = require('./launcher-service')

const app = express()
const PORT = process.env.PORT || 4021
const HOST = process.env.HOST || '127.0.0.1' // ローカル専用。他端末からのアクセスは想定しない

app.use(express.json({ limit: '256kb' }))
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/api/work-modes', (req, res) => {
  res.json({ workModes: configService.listWorkModes() })
})

app.post('/api/work-modes', (req, res) => {
  const result = configService.createWorkMode(req.body)
  if (result.errors) return res.status(400).json({ errors: result.errors })
  res.status(201).json({ workMode: result.workMode })
})

app.put('/api/work-modes/:id', (req, res) => {
  const result = configService.updateWorkMode(req.params.id, req.body)
  if (result.errors) return res.status(400).json({ errors: result.errors })
  res.json({ workMode: result.workMode })
})

app.delete('/api/work-modes/:id', (req, res) => {
  const deleted = configService.deleteWorkMode(req.params.id)
  if (!deleted) return res.status(404).json({ errors: ['業務モードが見つかりません'] })
  res.status(204).end()
})

app.post('/api/work-modes/:id/preview', (req, res) => {
  const targets = launcherService.preview(req.params.id)
  if (!targets) return res.status(404).json({ errors: ['業務モードが見つかりません'] })
  res.json({ targets })
})

app.post('/api/work-modes/:id/launch', async (req, res) => {
  const results = await launcherService.launch(req.params.id)
  if (!results) return res.status(404).json({ errors: ['業務モードが見つかりません'] })
  res.json({ results })
})

app.listen(PORT, HOST, () => {
  console.log(`自分専用業務ランチャー: http://${HOST}:${PORT}`)
})
