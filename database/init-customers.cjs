const { getDb } = require('./config.js');
const db = getDb();

console.log('Updating customers table structure...');

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN customer_type TEXT;
  `);
  console.log('Added customer_type column');
} catch (e) {
  console.log('customer_type column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN full_name TEXT;
  `);
  console.log('Added full_name column');
} catch (e) {
  console.log('full_name column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN used_credit REAL DEFAULT 0;
  `);
  console.log('Added used_credit column');
} catch (e) {
  console.log('used_credit column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN payment_days INTEGER;
  `);
  console.log('Added payment_days column');
} catch (e) {
  console.log('payment_days column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN tax_no TEXT;
  `);
  console.log('Added tax_no column');
} catch (e) {
  console.log('tax_no column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN bank_name TEXT;
  `);
  console.log('Added bank_name column');
} catch (e) {
  console.log('bank_name column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN bank_account TEXT;
  `);
  console.log('Added bank_account column');
} catch (e) {
  console.log('bank_account column already exists or error:', e.message);
}

try {
  db.exec(`
    ALTER TABLE customers ADD COLUMN remarks TEXT;
  `);
  console.log('Added remarks column');
} catch (e) {
  console.log('remarks column already exists or error:', e.message);
}

console.log('Customers table structure updated successfully');

console.log('Inserting complete customer test data...');

const stmt = db.prepare(`
  INSERT OR REPLACE INTO customers (
    customer_code, name, full_name, customer_type, contact_person, phone, email, 
    address, shipping_address, payment_method, payment_days, credit_limit, used_credit, 
    tax_rate, tax_no, bank_name, bank_account, remarks, status, source_system
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const customers = [
  {
    customer_code: 'C001',
    name: '华为技术有限公司',
    full_name: '华为技术有限公司',
    customer_type: '战略客户',
    contact_person: '张经理',
    phone: '13800138001',
    email: 'zhang@huawei.com',
    address: '深圳市龙岗区坂田华为基地',
    shipping_address: '深圳市龙岗区坂田华为基地A区',
    payment_method: '月结30天',
    payment_days: 30,
    credit_limit: 5000000,
    used_credit: 1200000,
    tax_rate: 13,
    tax_no: '91440300710943300X',
    bank_name: '工商银行深圳分行',
    bank_account: '6222082010001234567',
    remarks: '战略合作伙伴',
    status: 'active',
    source_system: 'ERP'
  },
  {
    customer_code: 'C002',
    name: '小米科技有限责任公司',
    full_name: '小米科技有限责任公司',
    customer_type: '战略客户',
    contact_person: '李总监',
    phone: '13800138002',
    email: 'li@xiaomi.com',
    address: '北京市海淀区清河中街68号',
    shipping_address: '北京市海淀区清河中街68号小米科技园',
    payment_method: '月结60天',
    payment_days: 60,
    credit_limit: 3000000,
    used_credit: 800000,
    tax_rate: 13,
    tax_no: '91110108592333400Y',
    bank_name: '建设银行北京分行',
    bank_account: '6227000012345678901',
    remarks: '重要客户',
    status: 'active',
    source_system: 'ERP'
  },
  {
    customer_code: 'C003',
    name: '比亚迪股份有限公司',
    full_name: '比亚迪股份有限公司',
    customer_type: 'OEM客户',
    contact_person: '王经理',
    phone: '13800138003',
    email: 'wang@byd.com',
    address: '深圳市坪山区比亚迪路3009号',
    shipping_address: '深圳市坪山区比亚迪路3009号工业园',
    payment_method: '月结30天',
    payment_days: 30,
    credit_limit: 2000000,
    used_credit: 500000,
    tax_rate: 13,
    tax_no: '91440300717538800Z',
    bank_name: '招商银行深圳分行',
    bank_account: '6225882010009876543',
    remarks: 'OEM合作',
    status: 'active',
    source_system: 'ERP'
  },
  {
    customer_code: 'C004',
    name: '广州电子科技有限公司',
    full_name: '广州电子科技有限公司',
    customer_type: '终端客户',
    contact_person: '陈经理',
    phone: '13800138004',
    email: 'chen@gzdz.com',
    address: '广州市天河区科韵路20号',
    shipping_address: '广州市天河区科韵路20号数码港',
    payment_method: '货到付款',
    payment_days: 0,
    credit_limit: 500000,
    usedCredit: 100000,
    tax_rate: 13,
    tax_no: '914401065923456789',
    bank_name: '工商银行广州分行',
    bank_account: '6222082010001111222',
    remarks: '小型客户',
    status: 'active',
    source_system: 'ERP'
  },
  {
    customer_code: 'C005',
    name: '上海电子元件经销商',
    full_name: '上海电子元件经销商',
    customer_type: '经销商',
    contact_person: '刘经理',
    phone: '13800138005',
    email: 'liu@shdz.com',
    address: '上海市浦东新区张江高科技园区',
    shipping_address: '上海市浦东新区张江高科技园区A栋',
    payment_method: '月结90天',
    payment_days: 90,
    credit_limit: 1000000,
    used_credit: 300000,
    tax_rate: 13,
    tax_no: '913101155923456790',
    bank_name: '中国银行上海分行',
    bank_account: '6216610200003333444',
    remarks: '经销商客户',
    status: 'active',
    source_system: 'ERP'
  },
  {
    customer_code: 'C006',
    name: '深圳通信设备有限公司',
    full_name: '深圳通信设备有限公司',
    customer_type: '终端客户',
    contact_person: '赵经理',
    phone: '13800138006',
    email: 'zhao@sztongxin.com',
    address: '深圳市南山区科技园南区',
    shipping_address: '深圳市南山区科技园南区软件产业基地',
    payment_method: '预付款',
    payment_days: 0,
    credit_limit: 800000,
    used_credit: 0,
    tax_rate: 13,
    tax_no: '914403005923456791',
    bank_name: '平安银行深圳分行',
    bank_account: '6225380200005555666',
    remarks: '新客户',
    status: 'active',
    source_system: 'ERP'
  }
];

for (const c of customers) {
  try {
    stmt.run(
      c.customer_code, c.name, c.full_name, c.customer_type, c.contact_person, c.phone, c.email,
      c.address, c.shipping_address, c.payment_method, c.payment_days, c.credit_limit, c.used_credit,
      c.tax_rate, c.tax_no, c.bank_name, c.bank_account, c.remarks, c.status, c.source_system
    );
    console.log(`Inserted: ${c.name}`);
  } catch (e) {
    console.log('Insert error:', e.message);
  }
}

console.log('All customer test data inserted successfully');