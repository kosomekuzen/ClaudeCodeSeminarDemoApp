const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  nativeTheme,
  globalShortcut,
  Notification,
  dialog,
} = require('electron')
const fs = require('fs')
const path = require('path')
const configService = require('./config-service')
const launcherService = require('./launcher-service')
const settingsService = require('./settings-service')

const IS_MAC = process.platform === 'darwin'
const ICON_PATH = path.join(__dirname, '..', '..', 'build', 'icon.png')
const WINDOW_WIDTH = 420
const WINDOW_HEIGHT = 640
const MIN_WINDOW_WIDTH = 360
const MIN_WINDOW_HEIGHT = 420
const HOTKEY_ACCELERATOR = 'CommandOrControl+Shift+Space'

let mainWindow = null
let tray = null
let isQuitting = false
let saveWindowStateTimer = null
let hotkeyRegistered = true

function createWindow(settings) {
  const bounds = { width: WINDOW_WIDTH, height: WINDOW_HEIGHT }
  if (settings.rememberPosition && settings.windowPosition) {
    bounds.x = settings.windowPosition.x
    bounds.y = settings.windowPosition.y
  }
  if (settings.rememberPosition && settings.windowSize) {
    bounds.width = settings.windowSize.width
    bounds.height = settings.windowSize.height
  }

  mainWindow = new BrowserWindow({
    ...bounds,
    resizable: true,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    frame: false,
    alwaysOnTop: settings.alwaysOnTop,
    opacity: settings.opacity,
    skipTaskbar: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))

  // ウィンドウを閉じてもアプリは終了させず、トレイに常駐させる(creditmonitoringと同じ挙動)。
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })

  const scheduleSaveWindowState = () => {
    if (!settingsService.readSettings().rememberPosition) return
    clearTimeout(saveWindowStateTimer)
    saveWindowStateTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      const [x, y] = mainWindow.getPosition()
      const [width, height] = mainWindow.getSize()
      settingsService.writeSettings({ windowPosition: { x, y }, windowSize: { width, height } })
    }, 400)
  }

  mainWindow.on('move', scheduleSaveWindowState)
  mainWindow.on('resize', scheduleSaveWindowState)
}

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 })
  // macOSのメニューバーはテンプレート画像(アルファのみを使う単色画像)にすると、
  // ライト/ダークのメニューバーに自動で追従する。
  if (IS_MAC) icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('お仕事スイッチ')

  const contextMenu = Menu.buildFromTemplate([
    { label: '開く', click: showWindow },
    { type: 'separator' },
    { label: '終了', click: () => { isQuitting = true; app.quit() } },
  ])

  if (IS_MAC) {
    // macOSでsetContextMenuすると左クリックでもメニューが開いてしまい、
    // クリックでの表示/非表示の切り替えができなくなる。左右で役割を分ける。
    tray.on('click', toggleWindow)
    tray.on('right-click', () => tray.popUpContextMenu(contextMenu))
  } else {
    tray.setContextMenu(contextMenu)
    tray.on('click', toggleWindow)
  }
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

function applyThemeSource(theme) {
  nativeTheme.themeSource = theme
}

function isDarkActive() {
  return nativeTheme.shouldUseDarkColors
}

function pushThemeToRenderer() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('theme:changed', { isDark: isDarkActive() })
}

// 他のアプリやOSに先に取られているとregisterはfalseを返す(macOSでは特に起こりやすい)。
// 黙って失敗すると「オンにしたのに効かない」状態になるため、成否を呼び出し元へ返す。
function applyHotkey(enabled) {
  globalShortcut.unregisterAll()
  if (!enabled) return true
  try {
    return globalShortcut.register(HOTKEY_ACCELERATOR, toggleWindow) !== false
  } catch {
    return false
  }
}

function applyAutoLaunch(enabled) {
  // 対応していない環境(このLinux開発環境含む)でも例外にならないよう保護する。
  try {
    app.setLoginItemSettings({ openAtLogin: enabled })
  } catch {
    // ログイン項目の設定に対応していない環境では何もしない。
  }
}

function applySettingsSideEffects(settings) {
  applyThemeSource(settings.theme)
  hotkeyRegistered = applyHotkey(settings.hotkeyEnabled)
  applyAutoLaunch(settings.autoLaunch)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop)
    mainWindow.setOpacity(settings.opacity)
  }
}

app.whenReady().then(() => {
  const settings = settingsService.readSettings()
  createWindow(settings)
  createTray()
  applySettingsSideEffects(settings)

  nativeTheme.on('updated', pushThemeToRenderer)
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // トレイ常駐アプリなので、ウィンドウが閉じてもプロセスは終了しない(macOSのDockアプリ終了慣習も同様に無視)。
})

// macOSでDockアイコンをクリックしたときは、トレイに格納中のウィンドウを開き直す。
app.on('activate', showWindow)

// ---- IPC: 業務モード ----

ipcMain.handle('work-modes:list', () => configService.listWorkModes())
ipcMain.handle('work-modes:create', (event, input) => configService.createWorkMode(input))
ipcMain.handle('work-modes:update', (event, id, input) => configService.updateWorkMode(id, input))
ipcMain.handle('work-modes:delete', (event, id) => configService.deleteWorkMode(id))
ipcMain.handle('work-modes:preview', (event, id) => launcherService.preview(id))

ipcMain.handle('work-modes:launch', async (event, id) => {
  const workMode = configService.getWorkMode(id)
  const results = await launcherService.launch(id)
  if (results && settingsService.readSettings().notifyOnComplete && Notification.isSupported()) {
    const failCount = results.filter((r) => !r.success).length
    new Notification({
      title: 'お仕事スイッチ',
      body:
        failCount > 0
          ? `${workMode?.name ?? ''}: ${results.length}件中${failCount}件失敗しました`
          : `${workMode?.name ?? ''}: ${results.length}件すべて開きました`,
    }).show()
  }
  return results
})

// ---- IPC: ウィンドウ操作 ----

ipcMain.handle('window:hide', () => mainWindow.hide())
ipcMain.handle('window:minimize', () => mainWindow.minimize())

// ---- IPC: 設定 ----

function settingsPayload(settings) {
  return {
    ...settings,
    isDark: isDarkActive(),
    accentPresets: settingsService.ACCENT_PRESETS,
    platform: process.platform,
    pathExample: configService.PATH_EXAMPLE,
    hotkeyLabel: IS_MAC ? '⌘ + Shift + Space' : 'Ctrl + Shift + Space',
    hotkeyRegistered,
  }
}

ipcMain.handle('settings:get', () => settingsPayload(settingsService.readSettings()))

ipcMain.handle('settings:update', (event, input) => {
  const next = settingsService.writeSettings(input)
  applySettingsSideEffects(next)
  return settingsPayload(next)
})

// ---- IPC: データのエクスポート/インポート ----

ipcMain.handle('data:export', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '業務モードを書き出す',
    defaultPath: 'work-modes.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return { canceled: true }

  const workModes = configService.listWorkModes()
  fs.writeFileSync(filePath, JSON.stringify({ version: 1, workModes }, null, 2))
  return { canceled: false, filePath }
})

ipcMain.handle('data:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '業務モードを読み込む',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths?.[0]) return { canceled: true }

  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'))
  } catch {
    return { canceled: false, errors: ['ファイルの読み込みに失敗しました(JSON形式ではありません)'] }
  }
  if (!Array.isArray(parsed?.workModes)) {
    return { canceled: false, errors: ['ファイルの形式が正しくありません'] }
  }

  const imported = []
  const errors = []
  parsed.workModes.forEach((mode, idx) => {
    const result = configService.createWorkMode(mode)
    if (result.errors) {
      errors.push(`${idx + 1}件目(${mode?.name ?? '無題'}): ${result.errors.join(' / ')}`)
    } else {
      imported.push(result.workMode)
    }
  })

  // 読み込んだ内容は必ず名前で返す。件数だけだと、何が追加されたのか利用者が確認できない。
  return {
    canceled: false,
    importedCount: imported.length,
    importedNames: imported.map((m) => m.name),
    errors,
  }
})
