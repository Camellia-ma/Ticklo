import { ipcMain } from 'electron'
import { getDB } from '../database'

export function registerCheckInIpc() {
  ipcMain.handle('get-check-in-data', (event, userId) => {
    const db = getDB()
    try {
      // Compatibility: if no userId, try to get default user
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
      return { dates: [] }
    }
  })

  ipcMain.handle('toggle-check-in', (event, { userId, date }) => {
    const db = getDB()
    try {
      let targetUserId = userId
      const dateStr = date || new Date().toISOString().split('T')[0] // Default today

      if (!targetUserId) {
        const user = db.prepare('SELECT id FROM users LIMIT 1').get()
        if (user) targetUserId = user.id
      }
      
      if (!targetUserId) throw new Error('User ID is required')

      const existing = db.prepare('SELECT id FROM check_ins WHERE user_id = ? AND check_in_date = ?').get(targetUserId, dateStr)
      
      db.transaction(() => {
        if (existing) {
          // Cancel check-in
          db.prepare('DELETE FROM check_ins WHERE id = ?').run(existing.id)
        } else {
          // Check-in
          db.prepare('INSERT INTO check_ins (user_id, check_in_date) VALUES (?, ?)').run(targetUserId, dateStr)
        }
        
        // Recalculate streaks
        const rows = db.prepare('SELECT check_in_date FROM check_ins WHERE user_id = ? ORDER BY check_in_date DESC').all(targetUserId)
        const dates = rows.map(row => row.check_in_date)
        
        let currentStreak = 0
        let maxStreak = 0
        
        const user = db.prepare('SELECT max_checkin_days FROM users WHERE id = ?').get(targetUserId)
        const oldMax = user ? user.max_checkin_days : 0

        if (dates.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          
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
        
        maxStreak = Math.max(oldMax, currentStreak)
        
        db.prepare('UPDATE users SET current_checkin_days = ?, max_checkin_days = ? WHERE id = ?')
          .run(currentStreak, maxStreak, targetUserId)
      })()

      const rows = db.prepare('SELECT check_in_date FROM check_ins WHERE user_id = ?').all(targetUserId)
      const newDates = rows.map(row => row.check_in_date)
      
      return { success: true, dates: newDates }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })
}
