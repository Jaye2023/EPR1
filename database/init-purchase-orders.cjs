const { getDb } = require('./config.js');
const db = getDb();

console.log('Creating purchase_orders table...');

db.exec(`
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    erp_order_number TEXT,
    supplier_code TEXT,
    supplier_name TEXT,
    material_code TEXT,
    material_name TEXT,
    specification TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT '件',
    unit_price REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    delivery_date TEXT,
    confirmed_date TEXT,
    status TEXT DEFAULT 'pending',
    quality_standard TEXT,
    delivery_batch TEXT,
    warehouse TEXT,
    account TEXT,
    budget REAL,
    tax_rate REAL DEFAULT 0,
    financial_dimension TEXT,
    source_system TEXT DEFAULT 'erp',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

console.log('Purchase orders table created successfully');

console.log('Inserting test purchase orders...');

const stmt = db.prepare(`
  INSERT OR IGNORE INTO purchase_orders (
    order_number, erp_order_number, supplier_code, supplier_name, material_code, 
    material_name, specification, quantity, unit, unit_price, total_amount, 
    delivery_date, confirmed_date, status, quality_standard, warehouse, 
    account, tax_rate, source_system
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const orders = [
  {
    order_number: 'PO2026001',
    erp_order_number: 'ERP-PO-001',
    supplier_code: 'SUP001',
    supplier_name: '东莞市铜业公司',
    material_code: 'MAT001',
    material_name: '铜材A',
    specification: 'T2紫铜 1.0mm',
    quantity: 1000,
    unit: 'kg',
    unit_price: 68.5,
    total_amount: 68500,
    delivery_date: '2026-06-15',
    status: 'pending',
    quality_standard: 'GB/T 4423-2017',
    warehouse: 'A仓库',
    account: '原材料',
    tax_rate: 13,
    source_system: 'erp'
  },
  {
    order_number: 'PO2026002',
    erp_order_number: 'ERP-PO-002',
    supplier_code: 'SUP002',
    supplier_name: '深圳塑料制品厂',
    material_code: 'MAT002',
    material_name: '塑料件B',
    specification: 'ABS材质 标准件',
    quantity: 5000,
    unit: '件',
    unit_price: 8.5,
    total_amount: 42500,
    delivery_date: '2026-06-20',
    confirmed_date: '2026-06-18',
    status: 'confirmed',
    quality_standard: 'ISO 9001',
    warehouse: 'B仓库',
    account: '原材料',
    tax_rate: 13,
    source_system: 'erp'
  },
  {
    order_number: 'PO2026003',
    erp_order_number: 'ERP-PO-003',
    supplier_code: 'SUP005',
    supplier_name: '上海电子元件厂',
    material_code: 'MAT003',
    material_name: '电阻元件',
    specification: '100Ω 1/4W',
    quantity: 10000,
    unit: '个',
    unit_price: 0.15,
    total_amount: 1500,
    delivery_date: '2026-06-10',
    confirmed_date: '2026-06-08',
    status: 'shipped',
    warehouse: 'C仓库',
    account: '原材料',
    tax_rate: 13,
    source_system: 'erp'
  },
  {
    order_number: 'PO2026004',
    erp_order_number: 'ERP-PO-004',
    supplier_code: 'SUP001',
    supplier_name: '东莞市铜业公司',
    material_code: 'MAT001',
    material_name: '铜材A',
    specification: 'T2紫铜 1.5mm',
    quantity: 500,
    unit: 'kg',
    unit_price: 72.0,
    total_amount: 36000,
    delivery_date: '2026-06-25',
    status: 'pending',
    warehouse: 'A仓库',
    account: '原材料',
    tax_rate: 13,
    source_system: 'erp'
  },
  {
    order_number: 'PO2026005',
    erp_order_number: 'ERP-PO-005',
    supplier_code: 'SUP003',
    supplier_name: '广州机械设备公司',
    material_code: 'MAT004',
    material_name: '设备配件',
    specification: '轴承型号6205',
    quantity: 100,
    unit: '个',
    unit_price: 85.0,
    total_amount: 8500,
    delivery_date: '2026-06-18',
    confirmed_date: '2026-06-16',
    status: 'shipped',
    warehouse: 'D仓库',
    account: '备品备件',
    tax_rate: 13,
    source_system: 'erp'
  },
  {
    order_number: 'PO2026006',
    erp_order_number: 'ERP-PO-006',
    supplier_code: 'SUP006',
    supplier_name: '北京包装材料公司',
    material_code: 'MAT005',
    material_name: '包装纸箱',
    specification: '40x30x20cm',
    quantity: 2000,
    unit: '个',
    unit_price: 3.5,
    total_amount: 7000,
    delivery_date: '2026-06-12',
    confirmed_date: '2026-06-10',
    status: 'received',
    warehouse: 'E仓库',
    account: '包装物',
    tax_rate: 13,
    source_system: 'erp'
  }
];

for (const o of orders) {
  try {
    stmt.run(
      o.order_number, o.erp_order_number, o.supplier_code, o.supplier_name, o.material_code,
      o.material_name, o.specification, o.quantity, o.unit, o.unit_price, o.total_amount,
      o.delivery_date, o.confirmed_date, o.status, o.quality_standard, o.warehouse,
      o.account, o.tax_rate, o.source_system
    );
    console.log(`Inserted: ${o.order_number}`);
  } catch (e) {
    console.log('Insert error:', e.message);
  }
}

console.log('All purchase orders inserted successfully');