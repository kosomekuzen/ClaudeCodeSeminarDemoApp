const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcherAPI', {
  listWorkModes: () => ipcRenderer.invoke('work-modes:list'),
  createWorkMode: (input) => ipcRenderer.invoke('work-modes:create', input),
  updateWorkMode: (id, input) => ipcRenderer.invoke('work-modes:update', id, input),
  deleteWorkMode: (id) => ipcRenderer.invoke('work-modes:delete', id),
  previewWorkMode: (id) => ipcRenderer.invoke('work-modes:preview', id),
  launchWorkMode: (id) => ipcRenderer.invoke('work-modes:launch', id),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (input) => ipcRenderer.invoke('settings:update', input),
  onThemeChanged: (callback) => {
    const listener = (event, payload) => callback(payload)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  },

  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
})
