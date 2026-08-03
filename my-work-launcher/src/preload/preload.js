const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcherAPI', {
  listWorkModes: () => ipcRenderer.invoke('work-modes:list'),
  createWorkMode: (input) => ipcRenderer.invoke('work-modes:create', input),
  updateWorkMode: (id, input) => ipcRenderer.invoke('work-modes:update', id, input),
  deleteWorkMode: (id) => ipcRenderer.invoke('work-modes:delete', id),
  previewWorkMode: (id) => ipcRenderer.invoke('work-modes:preview', id),
  launchWorkMode: (id) => ipcRenderer.invoke('work-modes:launch', id),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
})
