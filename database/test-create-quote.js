// 诊断报价单创建功能
import { getDb } from './config.js'

function query(sql, params = []) {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    return params.length > 0 ? stmt.all(...params) : stmt.all()
  } catch (error) {
    console.error('SQL Error:', error.message)
    throw error
  }
}

function run(sql, params = []) {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    return params.length > 0 ? stmt.run(...params) : stmt.run()
  } catch (error) {
    console.error('SQL Error:', error.message)
    throw error
  }
}

console.log('=== 报价单创建测试 ===\n')

// 1. 检查 customers 表
console.log('1. 检查 customers 表:')
const customers = query('SELECT id, customer_code, name FROM customers LIMIT 5')
console.log(`   共 ${customers.length} 条客户`)
if (customers.length > 0) {
  customers.forEach(c => {
    console.log(`   - ID: ${c.id}, 编码: ${c.customer_code}, 名称: ${c.name}`)
  })
}

console.log('')

// 2. 检查 users 表
console.log('2. 检查 users 表:')
const users = query('SELECT id, username, name FROM users LIMIT 5')
console.log(`   共 ${users.length} 条用户`)
if (users.length > 0) {
  users.forEach(u => {
    console.log(`   - ID: ${u.id}, 用户名: ${u.username}, 名称: ${u.name}`)
  })
}

console.log('')

// 3. 检查 products 表
console.log('3. 检查 products 表:')
const products = query('SELECT id, material_code, description, unit_price FROM products LIMIT 5')
console.log(`   共 ${products.length} 条产品`)
if (products.length > 0) {
  products.forEach(p => {
    console.log(`   - ID: ${p.id}, 物料编号: ${p.material_code || '-'}, 描述: ${p.description || '-'}, 单价: ${p.unit_price}`)
  })
}

console.log('')

// 4. 创建测试报价单
console.log('4. 创建测试报价单:')
try {
  // 使用第一条客户数据
  const customerId = customers[0]?.id || 1
  const salespersonId = users[0]?.id || 1
  const now = new Date().toISOString()
  const quoteNumber = `Q${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`

  // 插入报价单主表
  const result = run(`
    INSERT INTO quotes (
      quote_number, customer_id, salesperson_id, quote_date, valid_until,
      subtotal, total_amount, status, currency, remark,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    quoteNumber,
    customerId,
    salespersonId,
    now.split('T')[0],
    now.split('T')[0],
    1000,
    1130,
    'draft',
    'CNY',
    '测试报价单',
    now,
    now
  ])

  const quoteId = result.lastInsertRowid
  console.log(`   ✓ 报价单主表创建成功!`)
  console.log(`   - Quote ID: ${quoteId}`)
  console.log(`   - 报价单号: ${quoteNumber}`)
  console.log(`   - 客户ID: ${customerId}`)
  console.log(`   - 报价人ID: ${salespersonId}`)

  // 如果有产品数据，插入报价明细
  if (products.length > 0) {
    const product = products[0]
    run(`
      INSERT INTO quote_items (
        quote_id, material_code, description, wire_spec, formula,
        quantity, unit, unit_price, amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quoteId,
      product.material_code || 'M001',
      product.description || '测试产品',
      '',
      '',
      10,
      'pcs',
      product.unit_price || 100,
      (product.unit_price || 100) * 10,
      now
    ])
    console.log(`   ✓ 报价单明细创建成功!`)
  }

} catch (error) {
  console.log(`   ✗ 创建失败: ${error.message}`)
}

console.log('')

// 5. 验证报价单列表
console.log('5. 验证报价单列表:')
try {
  const quotes = query('SELECT q.*, c.name as customer_name FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id ORDER BY q.created_at DESC LIMIT 5')
  console.log(`   共 ${quotes.length} 条报价单`)
  quotes.forEach((q, i) => {
    console.log(`   [${i + 1}] ${q.quote_number} - ${q.customer_name} - ¥${q.total_amount} - ${q.status}`)
  })
} catch (error) {
  console.log(`   ✗ 查询失败: ${error.message}`)
}

console.log('\n=== 测试完成 ===')
