const { getDb } = require('./config.js');
const db = getDb();

console.log('Creating supplier_performance table...');

db.exec(`
  CREATE TABLE IF NOT EXISTS supplier_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_code TEXT,
    supplier_name TEXT,
    delivery_rate REAL DEFAULT 0,
    quality_score REAL DEFAULT 0,
    response_time REAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    overall_rating TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

console.log('Supplier performance table created successfully');

const stmt = db.prepare('INSERT OR IGNORE INTO supplier_performance (supplier_code, supplier_name, delivery_rate, quality_score, response_time, total_orders, total_amount, overall_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

const performances = [
  { supplier_code: 'SUP001', supplier_name: '东莞市铜业公司', delivery_rate: 98.5, quality_score: 4.5, response_time: 2, total_orders: 156, total_amount: 2580000, overall_rating: 'A' },
  { supplier_code: 'SUP002', supplier_name: '深圳塑料制品厂', delivery_rate: 92.0, quality_score: 4.0, response_time: 4, total_orders: 89, total_amount: 680000, overall_rating: 'B' },
  { supplier_code: 'SUP003', supplier_name: '广州机械设备公司', delivery_rate: 85.0, quality_score: 3.5, response_time: 8, total_orders: 23, total_amount: 156000, overall_rating: 'C' },
  { supplier_code: 'SUP004', supplier_name: '物流运输服务', delivery_rate: 99.0, quality_score: 4.8, response_time: 1, total_orders: 312, total_amount: 0, overall_rating: 'A' },
  { supplier_code: 'SUP005', supplier_name: '上海电子元件厂', delivery_rate: 96.5, quality_score: 4.6, response_time: 3, total_orders: 145, total_amount: 1890000, overall_rating: 'A' },
  { supplier_code: 'SUP006', supplier_name: '北京包装材料公司', delivery_rate: 88.0, quality_score: 3.8, response_time: 5, total_orders: 67, total_amount: 420000, overall_rating: 'B' }
];

console.log('Inserting test performance data...');

for (const p of performances) {
  try {
    stmt.run(p.supplier_code, p.supplier_name, p.delivery_rate, p.quality_score, p.response_time, p.total_orders, p.total_amount, p.overall_rating);
    console.log(`Inserted: ${p.supplier_name}`);
  } catch (e) {
    console.log('Insert error:', e.message);
  }
}

console.log('All performance data inserted successfully');
