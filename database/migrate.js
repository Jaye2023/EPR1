import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getDb } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'SQS', 'data')

function generateCode(prefix, id) {
  return `${prefix}${String(id).padStart(4, '0')}`
}

async function migrateData() {
  console.log('Starting data migration from SQS JSON files to SQLite...')
  console.log('=' .repeat(50))

  initDatabase()
  const db = getDb()

  try {
    const productsFile = path.join(dataDir, 'products.json')
    if (fs.existsSync(productsFile)) {
      const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf-8'))
      console.log(`\nMigrating ${productsData.length} products...`)

      const insertMaterial = db.prepare(`
        INSERT OR REPLACE INTO materials (material_code, material_name, material_type, specification, unit, price, status, source_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', 'SQS', ?, ?)
      `)

      let migratedCount = 0
      for (const p of productsData) {
        try {
          if (!p.materialCode) continue
          insertMaterial.run(
            p.materialCode,
            p.name || p.materialCode,
            p.materialType || '标准物料',
            p.specification || p.description || '',
            p.unit || 'PCS',
            p.unitPrice || p.price || 0,
            p.createdAt || new Date().toISOString(),
            p.updatedAt || new Date().toISOString()
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip product: ${p.materialCode} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} products`)
    } else {
      console.log('\nProducts file not found, skipping...')
    }

    const customersFile = path.join(dataDir, 'customers.json')
    if (fs.existsSync(customersFile)) {
      const content = fs.readFileSync(customersFile, 'utf-8')
      let customersData = []
      try {
        customersData = JSON.parse(content)
      } catch (e) {
        console.log('\nCustomers file has invalid JSON, skipping...')
      }

      if (customersData.length > 0) {
        console.log(`\nMigrating ${customersData.length} customers...`)

        const insertCustomer = db.prepare(`
          INSERT OR REPLACE INTO customers (customer_code, name, contact_person, phone, email, address, shipping_address, payment_method, status, source_system, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'SQS', ?, ?)
        `)

        let migratedCount = 0
        for (const c of customersData) {
          try {
            if (!c.customerNo && !c.name) continue
            insertCustomer.run(
              c.customerNo || generateCode('C', c.id),
              c.name || c.fullName || '',
              c.contactPerson || '',
              c.phone || '',
              c.email || '',
              c.address || '',
              c.shippingAddress || '',
              c.paymentMethod || '',
              c.createdAt || new Date().toISOString(),
              c.updatedAt || new Date().toISOString()
            )
            migratedCount++
          } catch (e) {
            console.log(`  Skip customer: ${c.customerNo} - ${e.message}`)
          }
        }
        console.log(`  Migrated ${migratedCount} customers`)
      }
    } else {
      console.log('\nCustomers file not found, skipping...')
    }

    const suppliersFile = path.join(dataDir, 'suppliers.json')
    if (fs.existsSync(suppliersFile)) {
      const suppliersData = JSON.parse(fs.readFileSync(suppliersFile, 'utf-8'))
      console.log(`\nMigrating ${suppliersData.length} suppliers...`)

      const insertSupplier = db.prepare(`
        INSERT OR REPLACE INTO suppliers (supplier_code, company_name, contact_person, contact_phone, address, bank_name, bank_account, status, source_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'SQS', ?, ?)
      `)

      let migratedCount = 0
      for (const s of suppliersData) {
        try {
          if (!s.supplierNo && !s.name) continue
          insertSupplier.run(
            s.supplierNo || generateCode('SUP', s.id),
            s.name || s.fullName || '',
            s.contactPerson || '',
            s.phone || '',
            s.address || '',
            s.bankName || '',
            s.bankAccount || '',
            s.createdAt || new Date().toISOString(),
            s.updatedAt || new Date().toISOString()
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip supplier: ${s.supplierNo} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} suppliers`)
    } else {
      console.log('\nSuppliers file not found, skipping...')
    }

    const quotesFile = path.join(dataDir, 'quotes.json')
    if (fs.existsSync(quotesFile)) {
      const quotesData = JSON.parse(fs.readFileSync(quotesFile, 'utf-8'))
      console.log(`\nMigrating ${quotesData.length} quotes...`)

      const insertQuote = db.prepare(`
        INSERT OR REPLACE INTO quotes (quote_number, customer_id, quote_date, valid_until, subtotal, tax_amount, total_amount, status, source_system, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SQS', ?, ?)
      `)

      let migratedCount = 0
      for (const q of quotesData) {
        try {
          if (!q.quoteNumber) continue
          insertQuote.run(
            q.quoteNumber,
            q.customerId || 1,
            q.quoteDate || new Date().toISOString(),
            q.validUntil || '',
            q.subtotal || 0,
            q.taxAmount || 0,
            q.totalAmount || 0,
            q.status || 'draft',
            q.createdAt || new Date().toISOString(),
            q.updatedAt || new Date().toISOString()
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip quote: ${q.quoteNumber} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} quotes`)
    } else {
      console.log('\nQuotes file not found, skipping...')
    }

    const wireSpecsFile = path.join(dataDir, 'wireSpecs.json')
    if (fs.existsSync(wireSpecsFile)) {
      const wireSpecsData = JSON.parse(fs.readFileSync(wireSpecsFile, 'utf-8'))
      console.log(`\nMigrating ${wireSpecsData.length} wire specs...`)

      const insertWireSpec = db.prepare(`
        INSERT OR REPLACE INTO wire_specs (spec, copper_weight, material_weight, filler_weight, outer_diameter, weight_per_meter, material_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `)

      let migratedCount = 0
      for (const w of wireSpecsData) {
        try {
          if (!w.spec) continue
          insertWireSpec.run(
            w.spec,
            w.copperWeight || 0,
            w.materialWeight || 0,
            w.fillerWeight || 0,
            w.outerDiameter || 0,
            w.weightPerMeter || 0,
            w.materialType || 'PVC'
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip wire spec: ${w.spec} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} wire specs`)
    } else {
      console.log('\nWire specs file not found, skipping...')
    }

    const plugsFile = path.join(dataDir, 'plugs.json')
    if (fs.existsSync(plugsFile)) {
      const plugsData = JSON.parse(fs.readFileSync(plugsFile, 'utf-8'))
      console.log(`\nMigrating ${plugsData.length} plugs...`)

      const insertPlug = db.prepare(`
        INSERT OR REPLACE INTO plugs (plug_code, name, price, currency, description, status, created_at, updated_at)
        VALUES (?, ?, ?, 'CNY', ?, 'active', ?, ?)
      `)

      let migratedCount = 0
      for (const p of plugsData) {
        try {
          if (!p.name) continue
          insertPlug.run(
            generateCode('PLUG', p.id),
            p.name,
            p.price || 0,
            p.description || '',
            p.createdAt || new Date().toISOString(),
            p.updatedAt || new Date().toISOString()
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip plug: ${p.name} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} plugs`)
    } else {
      console.log('\nPlugs file not found, skipping...')
    }

    const tailProcessingsFile = path.join(dataDir, 'tailProcessings.json')
    if (fs.existsSync(tailProcessingsFile)) {
      const tailProcessingsData = JSON.parse(fs.readFileSync(tailProcessingsFile, 'utf-8'))
      console.log(`\nMigrating ${tailProcessingsData.length} tail processings...`)

      const insertTailProcessing = db.prepare(`
        INSERT OR REPLACE INTO tail_processings (process_code, name, price, currency, description, status, created_at, updated_at)
        VALUES (?, ?, ?, 'CNY', ?, 'active', ?, ?)
      `)

      let migratedCount = 0
      for (const t of tailProcessingsData) {
        try {
          if (!t.name) continue
          insertTailProcessing.run(
            generateCode('TP', t.id),
            t.name,
            t.price || 0,
            t.description || '',
            t.createdAt || new Date().toISOString(),
            t.updatedAt || new Date().toISOString()
          )
          migratedCount++
        } catch (e) {
          console.log(`  Skip tail processing: ${t.name} - ${e.message}`)
        }
      }
      console.log(`  Migrated ${migratedCount} tail processings`)
    } else {
      console.log('\nTail processings file not found, skipping...')
    }

    console.log('\n' + '=' .repeat(50))
    console.log('Migration completed successfully!')
    console.log('\nSummary:')

    const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get()
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get()
    const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get()
    const wireSpecCount = db.prepare('SELECT COUNT(*) as count FROM wire_specs').get()
    const plugCount = db.prepare('SELECT COUNT(*) as count FROM plugs').get()
    const tailProcessingCount = db.prepare('SELECT COUNT(*) as count FROM tail_processings').get()
    const quoteCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get()

    console.log(`  - materials: ${materialCount.count}`)
    console.log(`  - customers: ${customerCount.count}`)
    console.log(`  - suppliers: ${supplierCount.count}`)
    console.log(`  - wire_specs: ${wireSpecCount.count}`)
    console.log(`  - plugs: ${plugCount.count}`)
    console.log(`  - tail_processings: ${tailProcessingCount.count}`)
    console.log(`  - quotes: ${quoteCount.count}`)

    console.log('\nYou can now start the unified API server with:')
    console.log('  npm run start:unified')

  } catch (error) {
    console.error('\nMigration failed:', error)
    throw error
  }
}

migrateData().catch(console.error)