import { ipcMain, dialog } from 'electron'
import fs from 'node:fs'
import { getDB } from '../database'

export function registerDataIpc() {
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
      
      if (!data.users || !Array.isArray(data.users)) throw new Error('Invalid backup file format')

      const transaction = db.transaction(() => {
        // Clear existing data
        db.prepare('DELETE FROM users').run()
        db.prepare('DELETE FROM todos').run()
        db.prepare('DELETE FROM completed_todos').run()
        db.prepare('DELETE FROM check_ins').run()

        // Restore data
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
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('clear-data', async () => {
    const db = getDB()
    try {
      const transaction = db.transaction(() => {
        // Keep user profile, clear stats and content
        db.prepare('UPDATE users SET max_checkin_days = 0, current_checkin_days = 0').run()
        db.prepare('DELETE FROM todos').run()
        db.prepare('DELETE FROM completed_todos').run()
        db.prepare('DELETE FROM check_ins').run()
      })
      transaction()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })
}
