import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'node:fs'
import { initDB, getDB, cleanUpCompletedTodos } from './database'

let mainWindow = null

function getConfigPath() {
  return join(app.getPath('userData'), 'user_config.json')
}

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
ipcMain.handle('get-check-in-data', (event, userId) => {
  const db = getDB()
  try {
    // 兼容：如果没有传 userId，尝试获取默认用户
    let targetUserId = userId
    if (!targetUserId) {
      const user = db.prepare('SELECT id FROM users LIMIT 1').get()
      if (user) targetUserId = user.id
    }
    
    if (!targetUserId) return { dates: [] }

    const rows = db.prepare('SELECT check_in_date FROM check_ins WHERE user_id = ?').all(targetUserId)
    const dates = rows.map(row => row.check_in_date)
    return { dates }
  } catch (e) {
    console.error('Read check-in data failed:', e)
    return { dates: [] }
  }
})

ipcMain.handle('toggle-check-in', (event, { userId, date }) => {
  const db = getDB()
  try {
    // 兼容：如果没有传 userId，尝试获取默认用户
    let targetUserId = userId
    const dateStr = date || new Date().toISOString().split('T')[0] // 默认今天

    if (!targetUserId) {
      const user = db.prepare('SELECT id FROM users LIMIT 1').get()
      if (user) targetUserId = user.id
    }
    
    if (!targetUserId) throw new Error('User ID is required')

    const existing = db.prepare('SELECT id FROM check_ins WHERE user_id = ? AND check_in_date = ?').get(targetUserId, dateStr)
    
    db.transaction(() => {
      if (existing) {
        // 取消打卡
        db.prepare('DELETE FROM check_ins WHERE id = ?').run(existing.id)
      } else {
        // 新增打卡
        db.prepare('INSERT INTO check_ins (user_id, check_in_date) VALUES (?, ?)').run(targetUserId, dateStr)
      }
      
      // 重新计算并更新连续打卡天数
      const rows = db.prepare('SELECT check_in_date FROM check_ins WHERE user_id = ? ORDER BY check_in_date DESC').all(targetUserId)
      const dates = rows.map(row => row.check_in_date)
      
      // 计算连续天数逻辑（简化版，假设 dates 已排序）
      let currentStreak = 0
      let maxStreak = 0 // 这里暂时简单处理，实际应该遍历历史记录计算最大值，或者只增不减
      
      // 获取当前用户现有记录
      const user = db.prepare('SELECT max_checkin_days FROM users WHERE id = ?').get(targetUserId)
      const oldMax = user ? user.max_checkin_days : 0

      if (dates.length > 0) {
        // 计算当前连胜
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        
        // 如果最新的打卡是今天或昨天，才算连胜中
        if (dates[0] === today || dates[0] === yesterday) {
          currentStreak = 1
          let currentDate = new Date(dates[0])
          
          for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(currentDate)
            prevDate.setDate(prevDate.getDate() - 1)
            const prevDateStr = prevDate.toISOString().split('T')[0]
            
            if (dates[i] === prevDateStr) {
              currentStreak++
              currentDate = prevDate
            } else {
              break
            }
          }
        }
      }
      
      // 更新 maxStreak
      maxStreak = Math.max(oldMax, currentStreak)
      
      db.prepare('UPDATE users SET current_checkin_days = ?, max_checkin_days = ? WHERE id = ?')
        .run(currentStreak, maxStreak, targetUserId)
    })()

    // 返回最新的打卡日期列表
    const rows = db.prepare('SELECT check_in_date FROM check_ins WHERE user_id = ?').all(targetUserId)
    const newDates = rows.map(row => row.check_in_date)
    
    return { success: true, dates: newDates }
  } catch (e) {
    console.error('Toggle check-in failed:', e)
    return { success: false, error: e.message }
  }
})

// User profile listeners
ipcMain.handle('get-user-profile', () => {
  const db = getDB()
  try {
    // 获取第一个用户，如果不存在则创建默认用户
    let user = db.prepare('SELECT * FROM users ORDER BY id ASC LIMIT 1').get()
    
    if (!user) {
      const info = db.prepare("INSERT INTO users (username, created_at) VALUES (?, datetime('now', 'localtime'))").run('Ticklo User')
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
    }
    
    return { success: true, user }
  } catch (e) {
    console.error('Get user profile failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('update-user-profile', (event, profile) => {
  const db = getDB()
  try {
    const { id, username, avatar_base64, motto, gender, hobbies } = profile
    
    if (!id) throw new Error('User ID is required')
    
    db.prepare(`
      UPDATE users 
      SET username = ?, avatar_base64 = ?, motto = ?, gender = ?, hobbies = ?
      WHERE id = ?
    `).run(username, avatar_base64, motto, gender, hobbies, id)
    
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    return { success: true, user: updatedUser }
  } catch (e) {
    console.error('Update user profile failed:', e)
    return { success: false, error: e.message }
  }
})

// Todo list listeners
ipcMain.handle('get-todos', (event, userId) => {
  const db = getDB()
  try {
    const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    return { success: true, todos }
  } catch (e) {
    console.error('Get todos failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('add-todo', (event, { userId, title, description }) => {
  const db = getDB()
  try {
    const info = db.prepare('INSERT INTO todos (user_id, title, description) VALUES (?, ?, ?)').run(userId, title, description || '')
    const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid)
    return { success: true, todo: newTodo }
  } catch (e) {
    console.error('Add todo failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('complete-todo', (event, todoId) => {
  const db = getDB()
  try {
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId)
    if (!todo) throw new Error('Todo not found')
    
    // 事务处理：移入 completed_todos 并从 todos 删除
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO completed_todos (user_id, title, description) VALUES (?, ?, ?)').run(todo.user_id, todo.title, todo.description)
      db.prepare('DELETE FROM todos WHERE id = ?').run(todoId)
    })
    transaction()
    
    return { success: true }
  } catch (e) {
    console.error('Complete todo failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('get-home-stats', (event, userId) => {
  const db = getDB()
  try {
    const pendingCount = db.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ?').get(userId).count
    // 仅统计今天的已完成事项
    const completedCount = db.prepare(`
      SELECT COUNT(*) as count FROM completed_todos 
      WHERE user_id = ? AND date(completed_at) = date('now', 'localtime')
    `).get(userId).count
    
    // 获取用户打卡数据
    const user = db.prepare('SELECT max_checkin_days, current_checkin_days FROM users WHERE id = ?').get(userId)
    
    return { success: true, stats: { pending: pendingCount, completed: completedCount, maxStreak: user ? user.max_checkin_days : 0, currentStreak: user ? user.current_checkin_days : 0 } }
  } catch (e) {
    console.error('Get home stats failed:', e)
    return { success: false, error: e.message }
  }
})

// Data management listeners
ipcMain.handle('export-data', async () => {
  const db = getDB()
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出数据',
      defaultPath: 'ticklo-backup.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (canceled || !filePath) return { success: false, canceled: true }

    const users = db.prepare('SELECT * FROM users').all()
    const todos = db.prepare('SELECT * FROM todos').all()
    const completedTodos = db.prepare('SELECT * FROM completed_todos').all()
    const checkIns = db.prepare('SELECT * FROM check_ins').all()

    const data = { users, todos, completedTodos, checkIns, exportedAt: new Date().toISOString() }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

    return { success: true, filePath }
  } catch (e) {
    console.error('Export data failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('import-data', async () => {
  const db = getDB()
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '导入数据',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) return { success: false, canceled: true }

    const data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'))
    
    // 简单的验证
    if (!data.users || !Array.isArray(data.users)) throw new Error('Invalid backup file format')

    const transaction = db.transaction(() => {
      // 清空现有数据
      db.prepare('DELETE FROM users').run()
      db.prepare('DELETE FROM todos').run()
      db.prepare('DELETE FROM completed_todos').run()
      db.prepare('DELETE FROM check_ins').run()

      // 恢复数据
      const insertUser = db.prepare('INSERT INTO users (id, username, avatar_base64, max_checkin_days, current_checkin_days, motto, gender, hobbies, created_at) VALUES (@id, @username, @avatar_base64, @max_checkin_days, @current_checkin_days, @motto, @gender, @hobbies, @created_at)')
      const insertTodo = db.prepare('INSERT INTO todos (id, user_id, title, description, created_at) VALUES (@id, @user_id, @title, @description, @created_at)')
      const insertCompleted = db.prepare('INSERT INTO completed_todos (id, user_id, title, description, completed_at) VALUES (@id, @user_id, @title, @description, @completed_at)')
      const insertCheckIn = db.prepare('INSERT INTO check_ins (id, user_id, check_in_date, created_at) VALUES (@id, @user_id, @check_in_date, @created_at)')

      data.users.forEach(user => insertUser.run(user))
      if (data.todos) data.todos.forEach(todo => insertTodo.run(todo))
      if (data.completedTodos) data.completedTodos.forEach(todo => insertCompleted.run(todo))
      if (data.checkIns) data.checkIns.forEach(checkIn => insertCheckIn.run(checkIn))
    })
    
    transaction()
    return { success: true }
  } catch (e) {
    console.error('Import data failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('clear-data', async () => {
  const db = getDB()
  try {
    const transaction = db.transaction(() => {
      // 保留用户基本信息，重置统计数据和内容
      db.prepare('UPDATE users SET max_checkin_days = 0, current_checkin_days = 0').run()
      db.prepare('DELETE FROM todos').run()
      db.prepare('DELETE FROM completed_todos').run()
      db.prepare('DELETE FROM check_ins').run()
    })
    transaction()
    return { success: true }
  } catch (e) {
    console.error('Clear data failed:', e)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion()
  }
})

ipcMain.handle('set-auto-launch', (event, enable) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe')
    })
    return { success: true, enabled: enable }
  } catch (e) {
    console.error('Set auto launch failed:', e)
    return { success: false, error: e.message }
  }
})

// Lifecycle events
app.whenReady().then(() => {
  initDB() // Initialize database
  cleanUpCompletedTodos() // Clean up old completed todos
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
