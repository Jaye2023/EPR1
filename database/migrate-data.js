import { getDb, initDatabase } from './config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrateWireSpecs() {
  const db = getDb()
  const wireSpecsPath = path.join(__dirname, '..', 'SQS', 'data', 'wireSpecs.json')
  
  try {
    const data = fs.readFileSync(wireSpecsPath, 'utf-8')
    const wireSpecs = JSON.parse(data)
    
    let importedCount = 0
    let skippedCount = 0
    
    for (const spec of wireSpecs) {
      try {
        const exists = db.prepare('SELECT id FROM wire_specs WHERE spec = ?').get(spec.spec)
        if (exists) {
          skippedCount++
          continue
        }
        
        db.prepare(`
          INSERT INTO wire_specs (
            spec, copper_weight, material_weight, filler_weight, 
            material_type, status, remark, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          spec.spec,
          spec.copperWeight || 0,
          spec.materialWeight || 0,
          spec.fillerWeight || 0,
          spec.materialType || '',
          'active',
          spec.type || '',
          spec.updatedAt || new Date().toISOString(),
          spec.updatedAt || new Date().toISOString()
        )
        importedCount++
      } catch (e) {
        console.log(`跳过电线规格 ${spec.spec}: ${e.message}`)
        skippedCount++
      }
    }
    
    console.log(`电线规格迁移完成: 导入 ${importedCount} 条, 跳过 ${skippedCount} 条`)
  } catch (e) {
    console.error('迁移电线规格数据失败:', e.message)
  }
}

async function migratePlugs() {
  const db = getDb()
  const plugsPath = path.join(__dirname, '..', 'SQS', 'data', 'plugs.json')
  
  try {
    const data = fs.readFileSync(plugsPath, 'utf-8')
    const plugs = JSON.parse(data)
    
    let importedCount = 0
    let skippedCount = 0
    
    for (const plug of plugs) {
      try {
        const exists = db.prepare('SELECT id FROM plugs WHERE plug_code = ?').get(plug.name)
        if (exists) {
          skippedCount++
          continue
        }
        
        db.prepare(`
          INSERT INTO plugs (
            plug_code, name, price, currency, description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          plug.name,
          plug.name,
          plug.price || 0,
          plug.currency || 'CNY',
          plug.description || '',
          plug.createdAt || new Date().toISOString(),
          plug.updatedAt || new Date().toISOString()
        )
        importedCount++
      } catch (e) {
        console.log(`跳过插头 ${plug.name}: ${e.message}`)
        skippedCount++
      }
    }
    
    console.log(`插头数据迁移完成: 导入 ${importedCount} 条, 跳过 ${skippedCount} 条`)
  } catch (e) {
    console.error('迁移插头数据失败:', e.message)
  }
}

async function migrateTailProcessings() {
  const db = getDb()
  const tailProcessingsPath = path.join(__dirname, '..', 'SQS', 'data', 'tailProcessings.json')
  
  try {
    const data = fs.readFileSync(tailProcessingsPath, 'utf-8')
    const processings = JSON.parse(data)
    
    let importedCount = 0
    let skippedCount = 0
    
    for (const processing of processings) {
      try {
        const exists = db.prepare('SELECT id FROM tail_processings WHERE process_code = ?').get(processing.name)
        if (exists) {
          skippedCount++
          continue
        }
        
        db.prepare(`
          INSERT INTO tail_processings (
            process_code, name, price, currency, description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          processing.name,
          processing.name,
          processing.price || 0,
          processing.currency || 'CNY',
          processing.description || '',
          processing.createdAt || new Date().toISOString(),
          processing.updatedAt || new Date().toISOString()
        )
        importedCount++
      } catch (e) {
        console.log(`跳过尾部处理 ${processing.name}: ${e.message}`)
        skippedCount++
      }
    }
    
    console.log(`尾部处理数据迁移完成: 导入 ${importedCount} 条, 跳过 ${skippedCount} 条`)
  } catch (e) {
    console.error('迁移尾部处理数据失败:', e.message)
  }
}

async function main() {
  console.log('开始迁移SQS数据到统一数据库...')
  
  initDatabase()
  
  await migrateWireSpecs()
  await migratePlugs()
  await migrateTailProcessings()
  
  console.log('所有数据迁移完成!')
}

main()
  .catch(e => console.error('迁移过程出错:', e))