import Database from 'better-sqlite3'
import { app } from 'electron'
import { join, dirname } from 'path'
import fs from 'fs'

let db = null

export function initDB() {
  // 获取安装目录（生产环境）或项目根目录（开发环境）
  const appPath = app.isPackaged ? dirname(app.getPath('exe')) : app.getAppPath()
  const dbDir = join(appPath, 'data') // 建议放在子目录中，避免直接放在根目录杂乱
  const dbPath = join(dbDir, 'ticklo.db')
  
  // 确保目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  try {
    db = new Database(dbPath)
    // 启用 WAL 模式以提高并发性能
    db.pragma('journal_mode = WAL')
    
    createTables()
    console.log('Database initialized successfully at:', dbPath)
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

function createTables() {
  if (!db) return

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      avatar_base64 TEXT,
      max_checkin_days INTEGER DEFAULT 0,
      current_checkin_days INTEGER DEFAULT 0,
      motto TEXT,
      gender TEXT,
      hobbies TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `

  // 检查并添加新字段（如果表已存在）
  try {
    const tableInfo = db.pragma('table_info(users)')
    const columns = tableInfo.map(col => col.name)
    
    if (!columns.includes('motto')) {
      db.prepare('ALTER TABLE users ADD COLUMN motto TEXT').run()
    }
    if (!columns.includes('gender')) {
      db.prepare('ALTER TABLE users ADD COLUMN gender TEXT').run()
    }
    if (!columns.includes('hobbies')) {
      db.prepare('ALTER TABLE users ADD COLUMN hobbies TEXT').run()
    }
  } catch (error) {
    console.error('Failed to migrate users table:', error)
  }

  const createTodosTable = `
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `

  const createCompletedTodosTable = `
    CREATE TABLE IF NOT EXISTS completed_todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `

  const createCheckInsTable = `
    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, check_in_date)
    )
  `

  db.transaction(() => {
    db.exec(createUsersTable)
    db.exec(createTodosTable)
    db.exec(createCompletedTodosTable)
    db.exec(createCheckInsTable)
  })()
}

export function cleanUpCompletedTodos() {
  if (!db) return
  try {
    // 删除所有不是今天的已完成事项
    // SQLite 的 date('now', 'localtime') 返回当前日期的 YYYY-MM-DD 格式
    const result = db.prepare(`
      DELETE FROM completed_todos 
      WHERE date(completed_at) != date('now', 'localtime')
    `).run()
    console.log(`Cleaned up ${result.changes} old completed todos.`)
  } catch (error) {
    console.error('Failed to clean up completed todos:', error)
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }
  return db
}
