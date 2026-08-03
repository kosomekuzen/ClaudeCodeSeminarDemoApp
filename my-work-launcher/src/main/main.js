const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')
const configService = require('./config-service')
const launcherService = require('./launcher-service')

const ICON_PATH = path.join(__dirname, '..', '..', 'build', 'icon.png')

let mainWindow = null
let tray = null
let isQuitting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
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
}

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('自分専用業務ランチャー')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '開く', click: showWindow },
      { type: 'separator' },
      { label: '終了', click: () => { isQuitting = true; app.quit() } },
    ])
  )
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      showWindow()
    }
  })
}

function showWindow() {
  mainWindow.show()
  mainWindow.focus()
}

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // トレイ常駐アプリなので、ウィンドウが閉じてもプロセスは終了しない(macOSのDockアプリ終了慣習も同様に無視)。
})

// ---- IPC ----

ipcMain.handle('work-modes:list', () => configService.listWorkModes())
ipcMain.handle('work-modes:create', (event, input) => configService.createWorkMode(input))
ipcMain.handle('work-modes:update', (event, id, input) => configService.updateWorkMode(id, input))
ipcMain.handle('work-modes:delete', (event, id) => configService.deleteWorkMode(id))
ipcMain.handle('work-modes:preview', (event, id) => launcherService.preview(id))
ipcMain.handle('work-modes:launch', (event, id) => launcherService.launch(id))
ipcMain.handle('window:hide', () => mainWindow.hide())
