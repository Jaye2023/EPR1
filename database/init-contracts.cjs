const { getDb } = require('./config.js');
const db = getDb();

console.log('Creating contracts table...');

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_number TEXT UNIQUE NOT NULL,
    contract_name TEXT NOT NULL,
    supplier_code TEXT,
    supplier_name TEXT,
    sign_date TEXT,
    expire_date TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

console.log('Contracts table created successfully');

const stmt = db.prepare('INSERT OR IGNORE INTO contracts (contract_number, contract_name, supplier_code, supplier_name, sign_date, expire_date, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

const contracts = [
  { contract_number: 'CT2026001', contract_name: '铜材采购框架协议', supplier_code: 'SUP001', supplier_name: '东莞市铜业公司', sign_date: '2026-01-01', expire_date: '2026-12-31', amount: 5000000, status: 'active' },
  { contract_number: 'CT2026002', contract_name: '塑料制品供应合同', supplier_code: 'SUP002', supplier_name: '深圳塑料制品厂', sign_date: '2026-03-01', expire_date: '2026-06-30', amount: 2000000, status: 'active' },
  { contract_number: 'CT2026003', contract_name: '设备维护服务协议', supplier_code: 'SUP003', supplier_name: '广州机械设备公司', sign_date: '2025-06-01', expire_date: '2026-05-31', amount: 500000, status: 'expiring' },
  { contract_number: 'CT2026004', contract_name: '物流运输服务合同', supplier_code: 'SUP004', supplier_name: '物流运输服务', sign_date: '2026-02-15', expire_date: '2026-08-15', amount: 800000, status: 'active' },
  { contract_number: 'CT2026005', contract_name: '电子元件采购协议', supplier_code: 'SUP005', supplier_name: '上海电子元件厂', sign_date: '2025-11-01', expire_date: '2026-10-31', amount: 3000000, status: 'active' },
  { contract_number: 'CT2026006', contract_name: '包装材料供应合同', supplier_code: 'SUP006', supplier_name: '北京包装材料公司', sign_date: '2026-01-15', expire_date: '2026-07-15', amount: 600000, status: 'active' }
];

console.log('Inserting test contracts...');

for (const c of contracts) {
  try {
    stmt.run(c.contract_number, c.contract_name, c.supplier_code, c.supplier_name, c.sign_date, c.expire_date, c.amount, c.status);
    console.log(`Inserted: ${c.contract_number}`);
  } catch (e) {
    console.log('Insert error:', e.message);
  }
}

console.log('All contracts inserted successfully');
