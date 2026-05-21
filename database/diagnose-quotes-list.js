// 诊断报价单列表
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

console.log('=== 报价单列表诊断 ===\n')

// 1. 检查 quotes 表数据
console.log('1. quotes 表数据:')
try {
  const quotes = query('SELECT q.*, c.name as customer_name FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id ORDER BY q.created_at DESC LIMIT 20')
  console.log(`   总计: ${quotes.length} 条报价单`)
  console.log('')
  if (quotes.length > 0) {
    console.log('   列表数据:')
    quotes.forEach((q, i) => {
      console.log(`   [${i + 1}] ID: ${q.id}, 单号: ${q.quote_number}, 客户: ${q.customer_name || 'N/A'}, 金额: ${q.total_amount}, 状态: ${q.status}`)
    })
  } else {
    console.log('   ⚠ 警告: quotes 表为空!')
  }
} catch (error) {
  console.log('   错误:', error.message)
}

console.log('')

// 2. 测试 API 查询函数
console.log('2. 测试 getQuotes API:')
try {
  const api = await import('./api.js')
  const result = api.getQuotes({ page: 1, pageSize: 20 })
  console.log('   返回结果:', JSON.stringify(result, null, 2))
  console.log('   ✓ API 调用成功!')
  console.log('   数据条数:', result.quotes?.length || result.data?.length || 0)
} catch (error) {
  console.log('   ✗ API 调用失败:', error.message)
}

console.log('\n=== 诊断完成 ===')
