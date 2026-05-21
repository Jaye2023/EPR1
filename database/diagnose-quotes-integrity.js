// 诊断报价单列表完整性和正确性
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

console.log('=== 报价单列表完整性诊断 ===\n')

// 1. 检查报价单主表
console.log('1. 报价单主表数据:')
const quotes = query('SELECT * FROM quotes ORDER BY created_at DESC')
console.log(`   总计: ${quotes.length} 条报价单\n`)
quotes.forEach((q, i) => {
  console.log(`   [${i + 1}] 报价单详情:`)
  console.log(`       - ID: ${q.id}`)
  console.log(`       - 报价单号: ${q.quote_number}`)
  console.log(`       - 客户ID: ${q.customer_id}`)
  console.log(`       - 报价人ID: ${q.salesperson_id}`)
  console.log(`       - 报价日期: ${q.quote_date}`)
  console.log(`       - 有效日期: ${q.valid_until}`)
  console.log(`       - 小计: ¥${q.subtotal}`)
  console.log(`       - 总金额: ¥${q.total_amount}`)
  console.log(`       - 状态: ${q.status}`)
  console.log(`       - 货币: ${q.currency}`)
  console.log(`       - 备注: ${q.remark || '-'}`)
  console.log(`       - 创建时间: ${q.created_at}`)
  console.log('')
})

// 2. 检查报价单明细
console.log('2. 报价单明细表数据:')
const items = query('SELECT * FROM quote_items ORDER BY created_at DESC')
console.log(`   总计: ${items.length} 条明细\n`)
items.forEach((item, i) => {
  console.log(`   [${i + 1}] 报价单ID: ${item.quote_id}, 物料: ${item.material_code || '-'}, 描述: ${item.description?.substring(0, 30) || '-'}...`)
})

console.log('')

// 3. 检查客户信息完整性
console.log('3. 客户信息完整性检查:')
const quotesWithCustomer = query(`
  SELECT q.id, q.quote_number, q.customer_id, c.name as customer_name, c.customer_code
  FROM quotes q
  LEFT JOIN customers c ON q.customer_id = c.id
  ORDER BY q.created_at DESC
`)

let missingCustomer = 0
let missingCustomerName = 0

quotesWithCustomer.forEach((q, i) => {
  if (!q.customer_id) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 客户ID为空`)
    missingCustomer++
  }
  if (!q.customer_name) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 客户名称为空 (customer_id=${q.customer_id})`)
    missingCustomerName++
  }
})

if (missingCustomer === 0 && missingCustomerName === 0) {
  console.log('   ✅ 所有报价单的客户信息完整')
} else {
  console.log(`   ⚠ 发现 ${missingCustomer} 个报价单缺少客户ID, ${missingCustomerName} 个报价单缺少客户名称`)
}

console.log('')

// 4. 检查报价人信息完整性
console.log('4. 报价人信息完整性检查:')
const quotesWithSalesperson = query(`
  SELECT q.id, q.quote_number, q.salesperson_id, u.name as salesperson_name
  FROM quotes q
  LEFT JOIN users u ON q.salesperson_id = u.id
  ORDER BY q.created_at DESC
`)

let missingSalesperson = 0
let missingSalespersonName = 0

quotesWithSalesperson.forEach((q, i) => {
  if (!q.salesperson_id) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 报价人ID为空`)
    missingSalesperson++
  }
  if (!q.salesperson_name) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 报价人名称为空 (salesperson_id=${q.salesperson_id})`)
    missingSalespersonName++
  }
})

if (missingSalesperson === 0 && missingSalespersonName === 0) {
  console.log('   ✅ 所有报价单的报价人信息完整')
} else {
  console.log(`   ⚠ 发现 ${missingSalesperson} 个报价单缺少报价人ID, ${missingSalespersonName} 个报价单缺少报价人名称`)
}

console.log('')

// 5. 数据一致性检查
console.log('5. 数据一致性检查:')
let inconsistentQuotes = []

quotes.forEach(q => {
  // 检查金额是否匹配
  if (q.subtotal > 0 && q.total_amount > 0 && q.subtotal === q.total_amount) {
    // 正常
  }
  
  // 检查日期格式
  if (q.quote_date && !/^\d{4}-\d{2}-\d{2}/.test(q.quote_date)) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 报价日期格式异常 (${q.quote_date})`)
    inconsistentQuotes.push(q.id)
  }
  
  if (q.valid_until && !/^\d{4}-\d{2}-\d{2}/.test(q.valid_until)) {
    console.log(`   ⚠ 报价单 ${q.quote_number}: 有效日期格式异常 (${q.valid_until})`)
    inconsistentQuotes.push(q.id)
  }
})

if (inconsistentQuotes.length === 0) {
  console.log('   ✅ 所有报价单数据格式正确')
}

console.log('')

// 6. 最终列表展示
console.log('6. 最终报价单列表:')
console.log('┌────────┬───────────────┬──────────────────┬────────────┬──────────┬─────────────┐')
console.log('│ 序号  │  报价单号     │ 客户             │ 报价人    │ 总金额   │ 状态       │')
console.log('├────────┼───────────────┼──────────────────┼────────────┼──────────┼─────────────┤')

quotesWithCustomer.forEach((q, i) => {
  const salesperson = quotesWithSalesperson.find(s => s.id === q.id)
  const salespersonName = salesperson?.salesperson_name || '-'
  const totalAmount = quotes.find(quote => quote.id === q.id)?.total_amount || 0
  const status = quotes.find(quote => quote.id === q.id)?.status || '-'
  const statusText = { draft: '草稿', sent: '已发送', confirmed: '已确认', rejected: '已拒绝' }[status] || status
  
  const customerName = q.customer_name || `ID:${q.customer_id}`
  console.log(`│ ${String(i + 1).padStart(4)} │ ${q.quote_number.padEnd(11)} │ ${customerName.substring(0, 14).padEnd(16)} │ ${salespersonName.substring(0, 8).padEnd(10)} │ ¥${String(totalAmount).padStart(6)} │ ${statusText.padEnd(9)} │`)
})

console.log('└────────┴───────────────┴──────────────────┴────────────┴──────────┴─────────────┘')

console.log('\n=== 诊断完成 ===')
