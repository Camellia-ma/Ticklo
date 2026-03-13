import { ipcMain } from 'electron'
import { getDB } from '../database'

export function registerUserIpc() {
  ipcMain.handle('get-user-profile', () => {
    const db = getDB()
    try {
      // Get the first user, if not exists, create a default one
      let user = db.prepare('SELECT * FROM users ORDER BY id ASC LIMIT 1').get()
      
      if (!user) {
        const info = db.prepare("INSERT INTO users (username, created_at) VALUES (?, datetime('now', 'localtime'))").run('Ticklo User')
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
      }
      
      return { success: true, user }
    } catch (e) {
      // console.error('Get user profile failed:', e)
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
      // console.error('Update user profile failed:', e)
      return { success: false, error: e.message }
    }
  })
}
