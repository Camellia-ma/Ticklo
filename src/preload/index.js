import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximizedStatus: (callback) => ipcRenderer.on('window-maximized-status', (_event, value) => callback(value)),
  saveUserConfig: (config) => ipcRenderer.invoke('save-user-config', config),
  getMotto: () => ipcRenderer.invoke('get-motto'),
  getCheckInData: () => ipcRenderer.invoke('get-check-in-data'),
  toggleCheckIn: (date) => ipcRenderer.invoke('toggle-check-in', date)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
