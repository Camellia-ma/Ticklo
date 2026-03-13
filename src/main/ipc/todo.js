import { ipcMain } from 'electron'
import { getDB } from '../database'

export function registerTodoIpc() {
  ipcMain.handle('get-todos', (event, userId) => {
    const db = getDB()
    try {
      const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC').all(userId)
      return { success: true, todos }
    } catch (e) {
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
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('complete-todo', (event, todoId) => {
    const db = getDB()
    try {
      const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId)
      if (!todo) throw new Error('Todo not found')
      
      // Transaction: move to completed_todos and delete from todos
      const transaction = db.transaction(() => {
        db.prepare('INSERT INTO completed_todos (user_id, title, description) VALUES (?, ?, ?)').run(todo.user_id, todo.title, todo.description)
        db.prepare('DELETE FROM todos WHERE id = ?').run(todoId)
      })
      transaction()
      
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('get-home-stats', (event, userId) => {
    const db = getDB()
    try {
      const pendingCount = db.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ?').get(userId).count
      // Only count completed todos for today
      const completedCount = db.prepare(`
        SELECT COUNT(*) as count FROM completed_todos 
        WHERE user_id = ? AND date(completed_at) = date('now', 'localtime')
      `).get(userId).count
      
      // Get user check-in data
      const user = db.prepare('SELECT max_checkin_days, current_checkin_days FROM users WHERE id = ?').get(userId)
      
      return { success: true, stats: { pending: pendingCount, completed: completedCount, maxStreak: user ? user.max_checkin_days : 0, currentStreak: user ? user.current_checkin_days : 0 } }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })
}
