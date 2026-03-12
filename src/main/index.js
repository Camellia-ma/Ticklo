import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'node:fs'

let mainWindow = null

function getConfigPath() {
  return join(app.getPath('userData'), 'user_config.json')
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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

// Window control listeners
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})


ipcMain.handle('get-motto', async () => {
  try {
    // 尝试多个 API 源作为备选
    const sources = [
      'https://api.lolimi.cn/API/wryl/api?type=json',
      'https://v1.hitokoto.cn/?encode=json' // 备用源：一言
    ]

    for (const url of sources) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        
        const data = await response.json()
        
        // 适配不同 API 的返回格式
        if (data.text) return data // lolimi 格式
        if (data.hitokoto) return { text: data.hitokoto } // hitokoto 格式
      } catch (e) {
        console.warn(`Fetch motto from ${url} failed, trying next...`)
      }
    }
    
    throw new Error('All sources failed')
  } catch (e) {
    console.error('Main process fetch motto failed:', e)
    return { text: '心之所向，素履以往。' } // Default fallback motto
  }
})

function getCheckInPath() {
  return join(app.getPath('userData'), 'check_in_data.json')
}

// Check-in data listeners
ipcMain.handle('get-check-in-data', () => {
  const filePath = getCheckInPath()
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      console.error('Read check-in data failed:', e)
      return { dates: [] }
    }
  }
  return { dates: [] }
})

ipcMain.handle('toggle-check-in', (event, dateStr) => {
  const filePath = getCheckInPath()
  let data = { dates: [] }
  
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      data = JSON.parse(fileContent)
    } catch (e) {
      console.error('Read check-in data failed:', e)
    }
  }

  const index = data.dates.indexOf(dateStr)
  if (index > -1) {
    // If already checked in, remove it (toggle off)
    data.dates.splice(index, 1)
  } else {
    // If not checked in, add it
    data.dates.push(dateStr)
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return { success: true, dates: data.dates }
  } catch (e) {
    console.error('Save check-in data failed:', e)
    return { success: false, error: e.message }
  }
})

// Lifecycle events
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
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
