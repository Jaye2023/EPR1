import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'unified.db')

let db = null

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    console.log('SQLite数据库连接成功:', dbPath)
  }
  return db
}

export function isDbAvailable() {
  try {
    getDb().exec('SELECT 1')
    return true
  } catch {
    return false
  }
}

export function initDatabase() {
  const database = getDb()
  initTables(database)
  console.log('统一数据库初始化完成')
}

export function initTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_code TEXT UNIQUE NOT NULL,
      material_name TEXT NOT NULL,
      material_type TEXT,
      specification TEXT,
      unit TEXT DEFAULT 'PCS',
      weight REAL,
      price REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      max_stock INTEGER DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      source_system TEXT DEFAULT 'SQS',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      shipping_address TEXT,
      payment_method TEXT,
      tax_rate REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      source_system TEXT DEFAULT 'SQS',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      unified_social_credit_code TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      bank_name TEXT,
      bank_account TEXT,
      tax_type TEXT DEFAULT 'general',
      payment_terms TEXT,
      status TEXT DEFAULT 'active',
      source_system TEXT DEFAULT 'SQS',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS supplier_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER,
      supplier_code TEXT UNIQUE NOT NULL,
      login_email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      unified_social_credit_code TEXT,
      tax_type TEXT DEFAULT 'general',
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      bank_name TEXT,
      bank_account TEXT,
      status TEXT DEFAULT 'pending_activation',
      review_status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS supplier_sub_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_account_id INTEGER NOT NULL,
      login_email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_account_id) REFERENCES supplier_accounts(id) ON DELETE CASCADE
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      quote_date TEXT NOT NULL,
      valid_until TEXT,
      currency TEXT DEFAULT 'CNY',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      profit_margin REAL DEFAULT 0.85,
      status TEXT DEFAULT 'draft',
      salesperson_id INTEGER,
      remark TEXT,
      source_system TEXT DEFAULT 'SQS',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      material_id INTEGER,
      product_name TEXT NOT NULL,
      specification TEXT,
      unit TEXT DEFAULT 'PCS',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      delivery_date TEXT,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS wire_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spec TEXT UNIQUE NOT NULL,
      price REAL DEFAULT 0,
      copper_weight REAL,
      material_weight REAL,
      filler_weight REAL DEFAULT 0,
      material_type TEXT,
      outer_diameter REAL,
      weight_per_meter REAL,
      copper_cost REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      filler_cost REAL DEFAULT 0,
      base_price REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      profit_margin REAL DEFAULT 0.85,
      copper_price_per_ton REAL,
      copper_process_fee REAL,
      material_price_per_ton REAL,
      filler_price_per_ton REAL,
      status TEXT DEFAULT 'active',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS plugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plug_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS tail_processings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      warehouse_id INTEGER DEFAULT 1,
      quantity INTEGER DEFAULT 0,
      reserved_quantity INTEGER DEFAULT 0,
      location TEXT,
      batch_number TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'available',
      source_system TEXT DEFAULT 'ERP',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS inventory_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      inventory_id INTEGER,
      record_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      before_quantity INTEGER DEFAULT 0,
      after_quantity INTEGER DEFAULT 0,
      reference_type TEXT,
      reference_id TEXT,
      operator_id INTEGER,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      quote_id INTEGER,
      order_date TEXT NOT NULL,
      delivery_date TEXT,
      currency TEXT DEFAULT 'CNY',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      source_system TEXT DEFAULT 'ERP',
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      material_id INTEGER,
      product_name TEXT NOT NULL,
      specification TEXT,
      unit TEXT DEFAULT 'PCS',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      delivered_quantity REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      role_id TEXT,
      status TEXT DEFAULT 'active',
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      category TEXT,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT,
      target_type TEXT,
      target_id TEXT,
      detail TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS copper_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price REAL NOT NULL,
      process_fee REAL DEFAULT 4000,
      supplier TEXT,
      effective_date TEXT,
      remark TEXT,
      is_current INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS copper_price_ranges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      min_copper_price INTEGER NOT NULL,
      max_copper_price INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_code TEXT UNIQUE NOT NULL,
      material_type TEXT,
      product_name TEXT NOT NULL,
      description TEXT,
      customer_part_no TEXT,
      part_no TEXT,
      plug_model TEXT,
      plug_price REAL DEFAULT 0,
      wire_spec TEXT,
      wire_unit_price REAL DEFAULT 0,
      length REAL DEFAULT 1,
      color TEXT,
      tail_processing TEXT,
      tail_processing_price REAL DEFAULT 0,
      customer_no TEXT,
      unit_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      remarks TEXT,
      status TEXT DEFAULT 'active',
      source_system TEXT DEFAULT 'SQS',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  console.log('所有数据表创建完成')
}

export default { getDb, isDbAvailable, initDatabase, initTables }