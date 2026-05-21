import { getDb } from './config.js'

console.log('开始电线规格数据库迁移...')

try {
  const db = getDb()
  
  // 获取当前表结构
  const tableInfo = db.pragma('table_info(wire_specs)')
  const columnNames = tableInfo.map(col => col.name)
  
  console.log('当前 wire_specs 表字段:', columnNames.join(', '))
  
  // 需要添加的字段
  const fieldsToAdd = [
    { name: 'copper_cost', type: 'REAL DEFAULT 0' },
    { name: 'material_cost', type: 'REAL DEFAULT 0' },
    { name: 'filler_cost', type: 'REAL DEFAULT 0' },
    { name: 'base_price', type: 'REAL DEFAULT 0' },
    { name: 'final_price', type: 'REAL DEFAULT 0' },
    { name: 'profit_margin', type: 'REAL DEFAULT 0.85' },
    { name: 'copper_price_per_ton', type: 'REAL' },
    { name: 'copper_process_fee', type: 'REAL' },
    { name: 'material_price_per_ton', type: 'REAL' },
    { name: 'filler_price_per_ton', type: 'REAL' }
  ]
  
  let addedCount = 0
  for (const field of fieldsToAdd) {
    if (!columnNames.includes(field.name)) {
      console.log(`添加字段: ${field.name}`)
      db.exec(`ALTER TABLE wire_specs ADD COLUMN ${field.name} ${field.type}`)
      addedCount++
    } else {
      console.log(`✓ 字段 ${field.name} 已存在`)
    }
  }
  
  console.log(`\n迁移完成！共添加 ${addedCount} 个新字段`)
  
  // 验证表结构
  const newTableInfo = db.pragma('table_info(wire_specs)')
  console.log('\n更新后的 wire_specs 表字段:')
  newTableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`)
  })
  
} catch (error) {
  console.error('迁移失败:', error)
  process.exit(1)
}
