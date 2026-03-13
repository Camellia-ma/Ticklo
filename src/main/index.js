import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB, cleanUpCompletedTodos, closeDB } from './database'

// Import IPC modules
import { registerUserIpc } from './ipc/user'
import { registerTodoIpc } from './ipc/todo'
import { registerCheckInIpc } from './ipc/checkin'
import { registerDataIpc } from './ipc/data'
import { registerAppIpc } from './ipc/app'
import { registerWindowIpc } from './ipc/window'

let mainWindow = null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-status', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-status', false)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Lifecycle events
app.whenReady().then(() => {
  // Initialize database
  initDB() 
  // Clean up old completed todos
  cleanUpCompletedTodos() 
  
  electronApp.setAppUserModelId('com.electron')
  
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC listeners
  registerUserIpc()
  registerTodoIpc()
  registerCheckInIpc()
  registerDataIpc()
  registerAppIpc()
  registerWindowIpc()

  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', (event) => {
  // 阻止默认行为以进行清理，但这里我们是同步清理，所以不需要阻止
  // 如果清理是异步的，需要 event.preventDefault()
  
  // Close database connection gracefully
  closeDB()
})
