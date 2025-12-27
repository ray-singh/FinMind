import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'finance.db')

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)

// Enable foreign keys
db.pragma('foreign_keys = ON')

export function initializeDatabase() {
  // Create transactions table with user_id for multi-tenancy
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      account TEXT,
      transaction_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add user_id column if it doesn't exist (migration for existing databases)
  try {
    db.exec(`ALTER TABLE transactions ADD COLUMN user_id TEXT DEFAULT ''`)
  } catch {
    // Column already exists, ignore
  }

  // Create categories table for categorization rules (global for now)
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
  `)

  // Insert default category rules
  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO category_rules (pattern, category) VALUES (?, ?)
  `)

  const defaultRules = [
    ['STARBUCKS', 'Coffee'],
    ['COFFEE', 'Coffee'],
    ['DUNKIN', 'Coffee'],
    ['PEET', 'Coffee'],
    ['WHOLE FOODS', 'Groceries'],
    ['SAFEWAY', 'Groceries'],
    ['TRADER JOE', 'Groceries'],
    ['KROGER', 'Groceries'],
    ['WALMART', 'Groceries'],
    ['TARGET', 'Shopping'],
    ['AMAZON', 'Shopping'],
    ['UBER', 'Transportation'],
    ['LYFT', 'Transportation'],
    ['SHELL', 'Gas'],
    ['CHEVRON', 'Gas'],
    ['EXXON', 'Gas'],
    ['BP ', 'Gas'],
    ['NETFLIX', 'Entertainment'],
    ['SPOTIFY', 'Entertainment'],
    ['HULU', 'Entertainment'],
    ['DISNEY', 'Entertainment'],
    ['RESTAURANT', 'Dining'],
    ['PIZZA', 'Dining'],
    ['MCDONALD', 'Dining'],
    ['CHIPOTLE', 'Dining'],
    ['SUBWAY', 'Dining'],
    ['VENMO', 'Transfer'],
    ['PAYPAL', 'Transfer'],
    ['ZELLE', 'Transfer'],
    ['ATM', 'Cash Withdrawal'],
    ['PHARMACY', 'Healthcare'],
    ['CVS', 'Healthcare'],
    ['WALGREENS', 'Healthcare'],
    ['GYM', 'Fitness'],
    ['FITNESS', 'Fitness'],
  ]

  for (const [pattern, category] of defaultRules) {
    insertRule.run(pattern, category)
  }
}

export interface Transaction {
  id?: number
  user_id: string
  date: string
  description: string
  amount: number
  category?: string
  account?: string
  transaction_type?: string
  created_at?: string
}

export function insertTransaction(transaction: Transaction) {
  const stmt = db.prepare(`
    INSERT INTO transactions (user_id, date, description, amount, category, account, transaction_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    transaction.user_id,
    transaction.date,
    transaction.description,
    transaction.amount,
    transaction.category,
    transaction.account,
    transaction.transaction_type
  )
}

export function getTransactions(userId: string, limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT ?
  `)
  return stmt.all(userId, limit) as Transaction[]
}

export function getCategoryRules() {
  const stmt = db.prepare('SELECT * FROM category_rules')
  return stmt.all() as Array<{ id: number; pattern: string; category: string }>
}

export function clearTransactions(userId: string) {
  const stmt = db.prepare('DELETE FROM transactions WHERE user_id = ?')
  return stmt.run(userId)
}

export function getTableSchema(tableName: string) {
  const stmt = db.prepare(`PRAGMA table_info(${tableName})`)
  return stmt.all()
}

export function getAllTables() {
  const stmt = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `)
  return stmt.all() as Array<{ name: string }>
}

// Initialize database on import
initializeDatabase()
