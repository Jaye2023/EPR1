zimport fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { getDb, initDatabase } = await import('./config.js')

async function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error(`读取文件失败 ${filePath}:`, error.message)
    return []
  }
}

async function migrateCustomers() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'customers.json')
  const customers = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const customer of customers) {
    try {
      const exists = db.prepare('SELECT id FROM customers WHERE customer_code = ?').get(customer.customerCode || customer.code || customer.id)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO customers (
          customer_code, name, contact_person, phone, email, address, 
          shipping_address, payment_method, tax_rate, credit_limit, 
          status, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customer.customerCode || customer.code || customer.id || `CUS-${Date.now()}`,
        customer.name || customer.companyName || '',
        customer.contactPerson || customer.contact || '',
        customer.phone || customer.mobile || '',
        customer.email || '',
        customer.address || '',
        customer.shippingAddress || '',
        customer.paymentMethod || '',
        customer.taxRate || 0,
        customer.creditLimit || 0,
        customer.status || 'active',
        customer.remark || '',
        customer.createdAt || customer.created_at || new Date().toISOString(),
        customer.updatedAt || customer.updated_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过客户 ${customer.name}:`, error.message)
      skipped++
    }
  }
  
  console.log(`客户数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateProducts() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'products.json')
  const products = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const product of products) {
    try {
      if (!product.id && !product.materialCode) continue
      
      const exists = db.prepare('SELECT id FROM materials WHERE material_code = ?').get(product.materialCode || product.productCode || product.id)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO materials (
          material_code, material_name, material_type, specification, 
          unit, weight, price, cost, min_stock, max_stock, 
          current_stock, status, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.materialCode || product.productCode || product.id || `MAT-${Date.now()}`,
        product.productName || product.name || '',
        product.category || product.type || '',
        product.specification || product.spec || '',
        product.unit || 'PCS',
        product.weight || 0,
        product.price || 0,
        product.cost || 0,
        product.minStock || 0,
        product.maxStock || 0,
        product.stock || product.currentStock || 0,
        product.status || 'active',
        product.remark || '',
        product.createdAt || product.created_at || new Date().toISOString(),
        product.updatedAt || product.updated_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过产品 ${product.productName}:`, error.message)
      skipped++
    }
  }
  
  console.log(`产品数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateSuppliers() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'suppliers.json')
  const suppliers = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const supplier of suppliers) {
    try {
      const exists = db.prepare('SELECT id FROM suppliers WHERE supplier_code = ?').get(supplier.supplierCode || supplier.code || supplier.id)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO suppliers (
          supplier_code, company_name, unified_social_credit_code, 
          contact_person, contact_phone, address, bank_name, 
          bank_account, tax_type, payment_terms, status, remark, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        supplier.supplierCode || supplier.code || supplier.id || `SUP-${Date.now()}`,
        supplier.companyName || supplier.name || '',
        supplier.unifiedSocialCreditCode || supplier.taxNumber || '',
        supplier.contactPerson || supplier.contact || '',
        supplier.contactPhone || supplier.phone || '',
        supplier.address || '',
        supplier.bankName || '',
        supplier.bankAccount || '',
        supplier.taxType || 'general',
        supplier.paymentTerms || '',
        supplier.status || 'active',
        supplier.remark || '',
        supplier.createdAt || supplier.created_at || new Date().toISOString(),
        supplier.updatedAt || supplier.updated_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过供应商 ${supplier.companyName}:`, error.message)
      skipped++
    }
  }
  
  console.log(`供应商数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateQuotes() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'quotes.json')
  const quotes = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const quote of quotes) {
    try {
      const exists = db.prepare('SELECT id FROM quotes WHERE quote_number = ?').get(quote.quoteNumber || quote.id)
      if (exists) {
        skipped++
        continue
      }
      
      const customer = db.prepare('SELECT id FROM customers WHERE customer_code = ?').get(quote.customerCode)
      const customerId = customer ? customer.id : 1
      
      db.prepare(`
        INSERT INTO quotes (
          quote_number, customer_id, quote_date, valid_until, 
          currency, subtotal, tax_amount, total_amount, 
          profit_margin, status, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        quote.quoteNumber || quote.id || `QT-${Date.now()}`,
        customerId,
        quote.quoteDate || new Date().toISOString(),
        quote.validUntil || '',
        quote.currency || 'CNY',
        quote.subtotal || 0,
        quote.taxAmount || 0,
        quote.totalAmount || quote.amount || 0,
        quote.profitMargin || 0.85,
        quote.status || 'draft',
        quote.remark || '',
        quote.createdAt || quote.created_at || new Date().toISOString(),
        quote.updatedAt || quote.updated_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过报价 ${quote.quoteNumber}:`, error.message)
      skipped++
    }
  }
  
  console.log(`报价数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateQuoteItems() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'quoteItems.json')
  const quoteItems = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const item of quoteItems) {
    try {
      const quote = db.prepare('SELECT id FROM quotes WHERE quote_number = ?').get(item.quoteNumber)
      if (!quote) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO quote_items (
          quote_id, product_name, specification, unit, 
          quantity, unit_price, total_price, delivery_date, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        quote.id,
        item.productName || item.name || '',
        item.specification || item.spec || '',
        item.unit || 'PCS',
        item.quantity || 1,
        item.unitPrice || item.price || 0,
        item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)),
        item.deliveryDate || '',
        item.remark || ''
      )
      imported++
    } catch (error) {
      console.error(`跳过报价明细:`, error.message)
      skipped++
    }
  }
  
  console.log(`报价明细数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateUsers() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'users.json')
  const users = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const user of users) {
    try {
      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO users (
          username, password, name, email, phone, department, 
          role_id, status, last_login, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.username || user.email || `user-${Date.now()}`,
        user.password || '123456',
        user.name || user.username || '',
        user.email || '',
        user.phone || user.mobile || '',
        user.department || '',
        user.roleId || user.role || '',
        user.status || 'active',
        user.lastLogin || '',
        user.createdAt || user.created_at || new Date().toISOString(),
        user.updatedAt || user.updated_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过用户 ${user.username}:`, error.message)
      skipped++
    }
  }
  
  console.log(`用户数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateRoles() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'roles.json')
  const roles = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const role of roles) {
    try {
      const exists = db.prepare('SELECT id FROM roles WHERE id = ?').get(role.id)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO roles (id, name, description, permissions) 
        VALUES (?, ?, ?, ?)
      `).run(
        role.id || `role-${Date.now()}`,
        role.name || '',
        role.description || '',
        JSON.stringify(role.permissions || [])
      )
      imported++
    } catch (error) {
      console.error(`跳过角色 ${role.name}:`, error.message)
      skipped++
    }
  }
  
  console.log(`角色数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateInventory() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'inventory.json')
  const inventory = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const item of inventory) {
    try {
      const material = db.prepare('SELECT id FROM materials WHERE material_code = ?').get(item.materialCode || item.productCode)
      if (!material) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO inventory (
          material_id, warehouse_id, quantity, reserved_quantity, 
          location, batch_number, expiry_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        material.id,
        item.warehouseId || 1,
        item.quantity || 0,
        item.reservedQuantity || 0,
        item.location || '',
        item.batchNumber || '',
        item.expiryDate || '',
        item.status || 'available'
      )
      imported++
    } catch (error) {
      console.error(`跳过库存记录:`, error.message)
      skipped++
    }
  }
  
  console.log(`库存数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateSettings() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'settings.json')
  const settings = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  if (typeof settings === 'object' && !Array.isArray(settings)) {
    for (const [key, value] of Object.entries(settings)) {
      try {
        const exists = db.prepare('SELECT id FROM settings WHERE setting_key = ?').get(key)
        if (exists) {
          skipped++
          continue
        }
        
        db.prepare(`
          INSERT INTO settings (setting_key, setting_value, category, description) 
          VALUES (?, ?, ?, ?)
        `).run(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
          'sqs',
          `从SQS系统迁移的设置: ${key}`
        )
        imported++
      } catch (error) {
        console.error(`跳过设置 ${key}:`, error.message)
        skipped++
      }
    }
  }
  
  console.log(`设置数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateSupplierAccounts() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'supplierAccounts.json')
  const accounts = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const account of accounts) {
    try {
      const exists = db.prepare('SELECT id FROM supplier_accounts WHERE login_email = ?').get(account.loginEmail || account.email)
      if (exists) {
        skipped++
        continue
      }
      
      db.prepare(`
        INSERT INTO supplier_accounts (
          supplier_code, login_email, password, company_name, 
          unified_social_credit_code, tax_type, contact_person, 
          contact_phone, address, bank_name, bank_account, 
          status, review_status, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        account.supplierCode || `SA-${Date.now()}`,
        account.loginEmail || account.email || '',
        account.password || '123456',
        account.companyName || '',
        account.unifiedSocialCreditCode || '',
        account.taxType || 'general',
        account.contactPerson || '',
        account.contactPhone || '',
        account.address || '',
        account.bankName || '',
        account.bankAccount || '',
        account.status || 'pending_activation',
        account.reviewStatus || 'pending',
        account.remark || '',
        account.createdAt || new Date().toISOString(),
        account.updatedAt || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过供应商账户 ${account.companyName}:`, error.message)
      skipped++
    }
  }
  
  console.log(`供应商账户数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateSupplierSubAccounts() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'supplierSubAccounts.json')
  const subAccounts = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const subAccount of subAccounts) {
    try {
      const exists = db.prepare('SELECT id FROM supplier_sub_accounts WHERE login_email = ?').get(subAccount.loginEmail || subAccount.email)
      if (exists) {
        skipped++
        continue
      }
      
      const supplierAccount = db.prepare('SELECT id FROM supplier_accounts WHERE login_email = ?').get(subAccount.parentEmail)
      const supplierAccountId = supplierAccount ? supplierAccount.id : 1
      
      db.prepare(`
        INSERT INTO supplier_sub_accounts (
          supplier_account_id, login_email, password, contact_person, 
          contact_phone, role, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        supplierAccountId,
        subAccount.loginEmail || subAccount.email || '',
        subAccount.password || '123456',
        subAccount.contactPerson || '',
        subAccount.contactPhone || '',
        subAccount.role || 'user',
        subAccount.status || 'active',
        subAccount.createdAt || new Date().toISOString(),
        subAccount.updatedAt || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过供应商子账户:`, error.message)
      skipped++
    }
  }
  
  console.log(`供应商子账户数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function migrateActivityLogs() {
  const db = getDb()
  const filePath = path.join(__dirname, '..', 'SQS', 'data', 'activityLogs.json')
  const logs = await readJsonFile(filePath)
  
  let imported = 0
  let skipped = 0
  
  for (const log of logs) {
    try {
      db.prepare(`
        INSERT INTO activity_logs (
          user_id, action, module, target_type, target_id, 
          detail, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        log.userId || null,
        log.action || '',
        log.module || '',
        log.targetType || '',
        log.targetId || '',
        log.detail || '',
        log.ipAddress || '',
        log.createdAt || log.created_at || new Date().toISOString()
      )
      imported++
    } catch (error) {
      console.error(`跳过活动日志:`, error.message)
      skipped++
    }
  }
  
  console.log(`活动日志数据迁移完成: 导入 ${imported} 条, 跳过 ${skipped} 条`)
}

async function main() {
  console.log('开始迁移SQS所有数据到统一数据库...')
  
  initDatabase()
  
  await migrateCustomers()
  await migrateProducts()
  await migrateSuppliers()
  await migrateQuotes()
  await migrateQuoteItems()
  await migrateUsers()
  await migrateRoles()
  await migrateInventory()
  await migrateSettings()
  await migrateSupplierAccounts()
  await migrateSupplierSubAccounts()
  await migrateActivityLogs()
  
  console.log('\n所有SQS数据迁移完成!')
}

main().catch(console.error)