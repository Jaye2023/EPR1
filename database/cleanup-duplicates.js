import { getDb } from './config.js'

const db = getDb()

function cleanupPlugs() {
  console.log('开始清理插头表重复数据...')
  
  const rows = db.prepare('SELECT * FROM plugs ORDER BY name').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.name.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条插头重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM plugs WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条插头重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM plugs').get()
  console.log(`插头表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupTailProcessings() {
  console.log('开始清理尾部处理表重复数据...')
  
  const rows = db.prepare('SELECT * FROM tail_processings ORDER BY name').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.name.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条尾部处理重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM tail_processings WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条尾部处理重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM tail_processings').get()
  console.log(`尾部处理表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupMaterials() {
  console.log('开始清理物料表重复数据...')
  
  const rows = db.prepare('SELECT * FROM materials ORDER BY material_code').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.material_code.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条物料重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM materials WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条物料重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM materials').get()
  console.log(`物料表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupCustomers() {
  console.log('开始清理客户表重复数据...')
  
  const rows = db.prepare('SELECT * FROM customers ORDER BY customer_code').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.customer_code.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条客户重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条客户重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM customers').get()
  console.log(`客户表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupSuppliers() {
  console.log('开始清理供应商表重复数据...')
  
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY supplier_code').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.supplier_code.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条供应商重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条供应商重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM suppliers').get()
  console.log(`供应商表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupWireSpecs() {
  console.log('开始清理电线规格表重复数据...')
  
  const rows = db.prepare('SELECT * FROM wire_specs ORDER BY spec').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.spec.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条电线规格重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM wire_specs WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条电线规格重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM wire_specs').get()
  console.log(`电线规格表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupUsers() {
  console.log('开始清理用户表重复数据...')
  
  const rows = db.prepare('SELECT * FROM users ORDER BY username').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.username.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条用户重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条用户重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM users').get()
  console.log(`用户表清理完成，剩余 ${remaining.count} 条记录`)
}

function cleanupRoles() {
  console.log('开始清理角色表重复数据...')
  
  const rows = db.prepare('SELECT * FROM roles ORDER BY id').all()
  const seen = new Set()
  const duplicates = []
  
  for (const row of rows) {
    const key = row.id.toLowerCase()
    if (seen.has(key)) {
      duplicates.push(row.id)
    } else {
      seen.add(key)
    }
  }
  
  console.log(`找到 ${duplicates.length} 条角色重复记录`)
  
  if (duplicates.length > 0) {
    const stmt = db.prepare('DELETE FROM roles WHERE id = ?')
    for (const id of duplicates) {
      stmt.run(id)
    }
    console.log(`已删除 ${duplicates.length} 条角色重复记录`)
  }
  
  const remaining = db.prepare('SELECT COUNT(*) as count FROM roles').get()
  console.log(`角色表清理完成，剩余 ${remaining.count} 条记录`)
}

function main() {
  console.log('='.repeat(60))
  console.log('          统一数据库重复数据清理工具')
  console.log('='.repeat(60))
  
  cleanupWireSpecs()
  console.log('')
  cleanupPlugs()
  console.log('')
  cleanupTailProcessings()
  console.log('')
  cleanupMaterials()
  console.log('')
  cleanupCustomers()
  console.log('')
  cleanupSuppliers()
  console.log('')
  cleanupUsers()
  console.log('')
  cleanupRoles()
  
  console.log('')
  console.log('='.repeat(60))
  console.log('           重复数据清理完成！')
  console.log('='.repeat(60))
}

main()