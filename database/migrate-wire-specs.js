import { getDb } from './config.js'

console.log('开始迁移数据库...')

try {
  const db = getDb()
  
  // 检查 wire_specs 表是否有 price 字段
  const tableInfo = db.pragma('table_info(wire_specs)')
  const hasPriceColumn = tableInfo.some(col => col.name === 'price')
  
  if (!hasPriceColumn) {
    console.log('为 wire_specs 表添加 price 字段...')
    db.exec('ALTER TABLE wire_specs ADD COLUMN price REAL DEFAULT 0')
    console.log('✓ price 字段添加成功')
  } else {
    console.log('✓ wire_specs 表已有 price 字段')
  }
  
  // 更新一些常用电线规格的价格
  const wireSpecs = [
    { spec: '3X1.25mm²', price: 2.5 },
    { spec: '3X0.75mm²', price: 1.8 },
    { spec: '2X0.75mm²', price: 1.2 },
    { spec: '18AWG', price: 0.8 },
    { spec: '16AWG', price: 1.2 },
    { spec: '14AWG', price: 1.8 }
  ]
  
  console.log('更新电线规格价格...')
  for (const ws of wireSpecs) {
    // 先检查是否存在
    const exists = db.exec(`SELECT id FROM wire_specs WHERE spec = '${ws.spec}'`)
    if (exists.length > 0) {
      db.exec(`UPDATE wire_specs SET price = ${ws.price} WHERE spec = '${ws.spec}'`)
      console.log(`✓ 更新 ${ws.spec} 价格为 ¥${ws.price}`)
    } else {
      db.exec(`
        INSERT INTO wire_specs (spec, price, copper_weight, material_weight, status)
        VALUES ('${ws.spec}', ${ws.price}, 0, 0, 'active')
      `)
      console.log(`✓ 添加 ${ws.spec} 价格为 ¥${ws.price}`)
    }
  }
  
  console.log('\n数据库迁移完成！')
} catch (error) {
  console.error('迁移失败:', error)
  process.exit(1)
}
