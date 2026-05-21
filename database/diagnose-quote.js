// 诊断脚本 - 检查报价单创建所需的数据
import { getDb } from './config.js'
import * as api from './api.js'

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

console.log('=== 报价单数据诊断 ===\n')

// 1. 检查数据库连接
console.log('1. 数据库连接状态:')
try {
  const db = getDb()
  console.log('   ✓ SQLite 数据库连接成功')
} catch (error) {
  console.log('   ✗ 数据库连接失败:', error.message)
  process.exit(1)
}

// 2. 检查 customers 表数据
console.log('\n2. customers 表数据:')
try {
  const customersData = query('SELECT id, customer_code, name FROM customers')
  if (customersData.length > 0) {
    customersData.forEach(c => {
      console.log(`   - ID: ${c.id}, Code: ${c.customer_code}, Name: ${c.name}`)
    })
    console.log(`   总计: ${customersData.length} 条`)
  } else {
    console.log('   ⚠ 警告: customers 表为空!')
  }
} catch (error) {
  console.log('   错误:', error.message)
}

// 3. 检查 users 表结构
console.log('\n3. users 表结构:')
try {
  const columns = query("PRAGMA table_info(users)")
  console.log('   列名:', columns.map(c => c.name).join(', '))
} catch (error) {
  console.log('   错误:', error.message)
}

// 4. 检查 users 表数据
console.log('\n4. users 表数据:')
try {
  const usersData = query('SELECT id, username, name, roleId FROM users LIMIT 5')
  if (usersData.length > 0) {
    usersData.forEach(u => {
      console.log(`   - ID: ${u.id}, Username: ${u.username}, Name: ${u.name}, RoleId: ${u.roleId}`)
    })
    console.log(`   总计: ${query('SELECT COUNT(*) as cnt FROM users')[0].cnt} 条`)
  } else {
    console.log('   ⚠ 警告: users 表为空!')
  }
} catch (error) {
  console.log('   错误:', error.message)
}

// 5. 测试报价单创建
console.log('\n5. 测试报价单创建:')

const customers = query('SELECT id, customer_code, name FROM customers')
const users = query('SELECT id, username, name FROM users LIMIT 1')

const testData = {
  customerCode: customers.length > 0 ? customers[0].customer_code : null,
  salespersonId: users.length > 0 ? users[0].id : null,
  quoteDate: new Date().toISOString().split('T')[0],
  currency: 'CNY',
  subtotal: 1000,
  totalAmount: 1130,
  status: 'draft',
  remark: '测试报价',
  items: [
    {
      materialCode: 'TEST001',
      description: '测试产品',
      quantity: 10,
      unit: 'pcs',
      unitPrice: 100,
      amount: 1000
    }
  ]
}

console.log('   测试数据:')
console.log('   - customerCode:', testData.customerCode)
console.log('   - salespersonId:', testData.salespersonId)
console.log('   - items:', testData.items.length, '项')

try {
  const result = api.createQuote(testData)
  console.log('   ✓ 报价单创建成功!')
  console.log('   新建报价单ID:', result.id)
  console.log('   报价单号:', result.quoteNumber)

  // 清理测试数据
  query('DELETE FROM quote_items WHERE quote_id = ?', [result.id])
  query('DELETE FROM quotes WHERE id = ?', [result.id])
  console.log('   ✓ 测试数据已清理')
} catch (error) {
  console.log('   ✗ 报价单创建失败!')
  console.log('   错误信息:', error.message)
}

console.log('\n=== 诊断完成 ===')
