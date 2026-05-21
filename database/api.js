import { getDb } from './config.js'

function query(sql, params = []) {
  const db = getDb()
  try {
    const stmt = db.prepare(sql)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return params.length > 0 ? stmt.all(...params) : stmt.all()
    } else {
      return params.length > 0 ? stmt.run(...params) : stmt.run()
    }
  } catch (error) {
    console.error('SQL Error:', error.message)
    throw error
  }
}

export function getMaterials(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(material_code LIKE ? OR material_name LIKE ? OR specification LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  if (params.materialType) {
    conditions.push(`material_type = ?`)
    queryParams.push(params.materialType)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM materials ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM materials ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))

  return { data: convertedRows, total: countResult[0]?.total || 0 }
}

export function getProducts(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(material_code LIKE ? OR product_name LIKE ? OR description LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM products ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => {
    const camelRow = convertToCamelCase(row)
    // 计算电线总价
    camelRow.wirePrice = (camelRow.wireUnitPrice || 0) * (camelRow.length || 0)
    return camelRow
  })

  return { data: convertedRows, total: countResult[0]?.total || 0 }
}

export function getProductById(id) {
  const row = query('SELECT * FROM products WHERE id = ?', [id])[0]
  if (!row) return null
  const camelRow = convertToCamelCase(row)
  // 计算电线总价
  camelRow.wirePrice = (camelRow.wireUnitPrice || 0) * (camelRow.length || 0)
  return camelRow
}

export function getProductByCode(materialCode) {
  const row = query('SELECT * FROM products WHERE material_code = ?', [materialCode])[0]
  if (!row) return null
  const camelRow = convertToCamelCase(row)
  // 计算电线总价
  camelRow.wirePrice = (camelRow.wireUnitPrice || 0) * (camelRow.length || 0)
  return camelRow
}

export function createProduct(product) {
  const result = query(`
    INSERT INTO products (material_code, material_type, product_name, description, customer_part_no, part_no, plug_model, plug_price, wire_spec, wire_unit_price, length, color, tail_processing, tail_processing_price, customer_no, unit_price, unit, remarks, status, source_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [product.materialCode || product.material_code, product.materialType || product.material_type || '', product.productName || product.product_name, product.description, product.customerPartNo || product.customer_part_no, product.partNo || product.part_no, product.plugModel || product.plug_model, product.plugPrice || product.plug_price || 0, product.wireSpec || product.wire_spec, product.wireUnitPrice || product.wire_unit_price || 0, product.length || 1, product.color, product.tailProcessing || product.tail_processing, product.tailProcessingPrice || product.tail_processing_price || 0, product.customerNo || product.customer_no, product.unitPrice || product.unit_price || 0, product.unit || 'pcs', product.remarks, product.status || 'active', product.sourceSystem || product.source_system || 'SQS'])
  return { id: result.lastInsertRowid, ...product }
}

export function updateProduct(id, product) {
  query(`
    UPDATE products SET material_code = ?, material_type = ?, product_name = ?, description = ?, customer_part_no = ?, part_no = ?, plug_model = ?, plug_price = ?, wire_spec = ?, wire_unit_price = ?, length = ?, color = ?, tail_processing = ?, tail_processing_price = ?, customer_no = ?, unit_price = ?, unit = ?, remarks = ?, status = ?, source_system = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [product.materialCode || product.material_code, product.materialType || product.material_type || '', product.productName || product.product_name, product.description, product.customerPartNo || product.customer_part_no, product.partNo || product.part_no, product.plugModel || product.plug_model, product.plugPrice || product.plug_price, product.wireSpec || product.wire_spec, product.wireUnitPrice || product.wire_unit_price, product.length, product.color, product.tailProcessing || product.tail_processing, product.tailProcessingPrice || product.tail_processing_price, product.customerNo || product.customer_no, product.unitPrice || product.unit_price, product.unit, product.remarks, product.status, product.sourceSystem || product.source_system, id])
  return { id, ...product }
}

export function deleteProduct(id) {
  query('DELETE FROM products WHERE id = ?', [id])
  return true
}

export function batchDeleteProducts(ids) {
  if (ids.length === 0) return true
  const placeholders = ids.map(() => '?').join(',')
  query(`DELETE FROM products WHERE id IN (${placeholders})`, ids)
  return true
}

export function generateProductCode(materialType = '') {
  const typePrefix = {
    'WIRE': 'W',
    'PLUG': 'P',
    'CABLE': 'C',
    'TERMINAL': 'T',
    'OTHER': 'O'
  }
  
  const prefix = typePrefix[materialType] || 'M'
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  const dateStr = `${year}${month}${day}`
  const pattern = `${prefix}${dateStr}%`
  
  const rows = query('SELECT material_code FROM products WHERE material_code LIKE ? ORDER BY material_code DESC LIMIT 1', [pattern])
  
  let sequence = 1
  if (rows.length > 0) {
    const lastCode = rows[0].material_code
    const seqMatch = lastCode.match(/\d+$/)
    if (seqMatch) {
      sequence = parseInt(seqMatch[0]) + 1
    }
  }
  
  const seqStr = String(sequence).padStart(4, '0')
  return `${prefix}${dateStr}${seqStr}`
}

export function getMaterialByCode(materialCode) {
  const row = query('SELECT * FROM materials WHERE material_code = ?', [materialCode])[0]
  return row ? convertToCamelCase(row) : null
}

export function getMaterialById(id) {
  const row = query('SELECT * FROM materials WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createMaterial(material) {
  const result = query(`
    INSERT INTO materials (material_code, material_name, material_type, specification, unit, weight, price, cost, min_stock, max_stock, current_stock, status, source_system, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [material.material_code, material.material_name, material.material_type, material.specification, material.unit || 'PCS', material.weight, material.price || 0, material.cost || 0, material.min_stock || 0, material.max_stock || 0, material.current_stock || 0, material.status || 'active', material.source_system || 'SQS', material.remark])
  return { id: result.lastInsertRowid, ...material }
}

export function updateMaterial(id, material) {
  query(`
    UPDATE materials SET material_code = ?, material_name = ?, material_type = ?, specification = ?, unit = ?, weight = ?, price = ?, cost = ?, min_stock = ?, max_stock = ?, current_stock = ?, status = ?, source_system = ?, remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [material.material_code, material.material_name, material.material_type, material.specification, material.unit, material.weight, material.price, material.cost, material.min_stock, material.max_stock, material.current_stock, material.status, material.source_system, material.remark, id])
  return { id, ...material }
}

export function deleteMaterial(id) {
  query('DELETE FROM materials WHERE id = ?', [id])
  return true
}

export function batchDeleteMaterials(ids) {
  if (ids.length === 0) return true
  const placeholders = ids.map(() => '?').join(',')
  query(`DELETE FROM materials WHERE id IN (${placeholders})`, ids)
  return true
}

export function parseProductWithPrice(description) {
  const parsed = parseProductDescription(description)
  
  let wireUnitPrice = 0
  if (parsed.wireSpec) {
    const specs = query('SELECT * FROM wire_specs WHERE spec = ?', [parsed.wireSpec])
    if (specs.length > 0) {
      wireUnitPrice = specs[0].price || 0
    }
  }
  
  const plugPrice = parsed.plugPrice || 0
  const tailProcessingPrice = parsed.tailProcessing.length * 0.1
  
  const wireCost = wireUnitPrice * parsed.length
  const totalPrice = wireCost + plugPrice + tailProcessingPrice
  
  const calculation = {
    wireCost: parseFloat(wireCost.toFixed(4)),
    plugPrice: parseFloat(plugPrice.toFixed(2)),
    tailProcessingPrice: parseFloat(tailProcessingPrice.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(4)),
    breakdown: {
      wireCost: parseFloat(wireCost.toFixed(4)),
      plugPrice: parseFloat(plugPrice.toFixed(2)),
      tailProcessingPrice: parseFloat(tailProcessingPrice.toFixed(2))
    }
  }
  
  const plugInfo = parsed.plugModel ? { name: parsed.plugModel, price: parsed.plugPrice } : null
  const wireSpecInfo = parsed.wireSpec ? { spec: parsed.wireSpec, unitPrice: wireUnitPrice } : null
  const tailProcessingDetails = parsed.tailProcessing.map(name => ({
    name,
    price: 0.1,
    totalPrice: 0.1
  }))
  
  return {
    parsedData: {
      ...parsed,
      plugInfo,
      wireSpecInfo,
      tailProcessings: parsed.tailProcessing,
      tailProcessingDetails
    },
    calculation
  }
}

export function parseProductDescription(description) {
  const result = {
    plugModel: '',
    plugPrice: 0,
    wireSpec: '',
    length: 1,
    tailProcessing: [],
    color: '',
    customerPartNo: '',
    description: description
  }
  
  const plugPatterns = [
    { pattern: /台湾三插\s*(\d+)A|TW\s*(\d+)A/i, name: '台湾三插', price: 3.5 },
    { pattern: /ML-\d+\s*\([^)]*台湾[^)]*\)/i, name: '台湾三插', price: 3.5 },
    { pattern: /ML-\d+\s*\([^)]*三插[^)]*\)/i, name: '台湾三插', price: 3.5 },
    { pattern: /BS\s*DL203/i, name: 'BS DL203(13A)', price: 4.2 },
    { pattern: /BS\s*13A/i, name: 'BS 13A', price: 3.8 },
    { pattern: /IEC\s*C13/i, name: 'IEC C13', price: 2.5 },
    { pattern: /IEC\s*C14/i, name: 'IEC C14', price: 2.8 },
    { pattern: /NEMA\s*5-15P/i, name: 'NEMA 5-15P', price: 3.2 },
    { pattern: /NEMA\s*5-15R/i, name: 'NEMA 5-15R', price: 3.0 },
    { pattern: /Schuko/i, name: 'Schuko', price: 2.9 },
    { pattern: /UK\s*plug/i, name: 'UK plug', price: 4.0 },
    { pattern: /EU\s*plug/i, name: 'EU plug', price: 2.7 },
    { pattern: /US\s*plug/i, name: 'US plug', price: 3.1 },
    { pattern: /AU\s*plug/i, name: 'AU plug', price: 3.5 },
    { pattern: /两插 | 两脚|2 脚/i, name: '两插', price: 2.0 },
    { pattern: /三插 | 三脚|3 脚/i, name: '三插', price: 2.5 }
  ]
  
  for (const plug of plugPatterns) {
    if (plug.pattern.test(description)) {
      result.plugModel = plug.name
      result.plugPrice = plug.price
      break
    }
  }
  
  const wireSpecPatterns = [
    /(\d+)X(\d+\.?\d*)\s*mm[²2]?/,  // 3X1.25mm²
    /VCTF\s+(\d+)X(\d+\.?\d*)/,  // VCTF 3X1.25
    /(\d{1,2})[xX*](\d+\.?\d*)(?:\s*mm[²2]?)?/,  // 3x0.75mm² or 3*0.75 (H05VV-F 3*0.75)
    /(\d{1,2})x(\d{1,2})AWG/,  // 2x18AWG
    /(\d{1,2})AWG/,  // 18AWG
    /(\d+\.?\d*)\s*mm[²2]?/  // 1.25mm²
  ]
  
  for (const pattern of wireSpecPatterns) {
    const match = description.match(pattern)
    if (match) {
      if (pattern.toString().includes('VCTF') || pattern.toString().includes('x') || pattern.toString().includes('X') || pattern.toString().includes('*')) {
        result.wireSpec = `${match[1]}X${match[2]}mm²`
      } else if (pattern.toString().includes('AWG')) {
        result.wireSpec = `${match[1]}AWG`
      } else if (match[1]) {
        result.wireSpec = `${match[1]}mm²`
      }
      break
    }
  }
  
  const lengthPatterns = [
    /总长.*?(\d+\.?\d*)\s*(m|米|meter)/i,  // 总长=0.88 米
    /长度.*?(\d+\.?\d*)\s*(m|米|meter)/i,  // 长度=0.88 米
    /(\d+\.?\d*)\s*(m|米|meter)(?:长)?/i  // 0.88 米
  ]
  
  // 先尝试精确匹配（总长、长度）
  let lengthFound = false
  for (const pattern of lengthPatterns.slice(0, 2)) {
    const match = description.match(pattern)
    if (match) {
      result.length = parseFloat(match[1])
      lengthFound = true
      break
    }
  }
  
  // 如果没有精确匹配，尝试通用匹配（排除剥线等描述）
  if (!lengthFound) {
    for (const pattern of lengthPatterns.slice(2)) {
      const match = description.match(pattern)
      if (match) {
        // 检查是否在剥线、剥皮等上下文中
        const matchIndex = match.index
        const contextStart = Math.max(0, matchIndex - 10)
        const context = description.substring(contextStart, matchIndex)
        if (!/(剥线 | 剥皮|脱皮|strip)/i.test(context)) {
          result.length = parseFloat(match[1])
          break
        }
      }
    }
  }
  
  const colorPatterns = [
    { pattern: /黑色|黑|black/i, color: '黑色' },
    { pattern: /白色|白|white/i, color: '白色' },
    { pattern: /红色|红|red/i, color: '红色' },
    { pattern: /蓝色|蓝|blue/i, color: '蓝色' },
    { pattern: /绿色|绿|green/i, color: '绿色' },
    { pattern: /黄色|黄|yellow/i, color: '黄色' },
    { pattern: /灰色|灰|gray/i, color: '灰色' },
    { pattern: /透明|透|clear/i, color: '透明' }
  ]
  
  for (const color of colorPatterns) {
    if (color.pattern.test(description)) {
      result.color = color.color
      break
    }
  }
  
  const tailProcessPatterns = [
    { pattern: /脱皮 | 剥皮 | 剥线/i, name: '尾部脱皮', price: 0.05 },
    { pattern: /沾锡 | 上锡|tin|tinning/i, name: '尾部沾锡', price: 0.06 },
    { pattern: /端子|压端|terminal|crimp/i, name: '尾部压端', price: 0.12 },
    { pattern: /热缩|heat shrink/i, name: '尾部热缩', price: 0.04 },
    { pattern: /扎线|tie/i, name: '尾部扎线', price: 0.03 },
    { pattern: /护套|sheath|grommet/i, name: '尾部护套', price: 0.10 },
    { pattern: /PVC/i, name: 'PVC 护套', price: 0.10 }
  ]
  
  for (const tp of tailProcessPatterns) {
    if (tp.pattern.test(description)) {
      result.tailProcessing.push(tp.name)
    }
  }
  
  // 识别端子类型（特殊处理）
  const terminalPattern = /(\d+-\d+)\s*端子\s*[\(（](零火线 | 地线)[\)）]/i
  const terminalMatch = description.match(terminalPattern)
  if (terminalMatch) {
    const terminalType = terminalMatch[1]
    const position = terminalMatch[2]
    result.tailProcessing.push(`${position}用${terminalType}端子`)
  }
  
  // 识别剥线长度
  const stripLengthPattern = /剥线\s*(\d+\.?\d*)\s*mm/i
  const stripLengthMatch = description.match(stripLengthPattern)
  if (stripLengthMatch) {
    result.tailProcessing.push(`剥线${stripLengthMatch[1]}mm`)
  }
  
  const partNoMatch = description.match(/料号[:：]\s*(\S+)/i)
  if (partNoMatch) {
    result.customerPartNo = partNoMatch[1]
  }
  
  return result
}

export function calculateProductPrice(params) {
  const { wireUnitPrice = 0, length = 1, plugPrice = 0, tailProcessingPrice = 0 } = params
  const wirePrice = wireUnitPrice * length
  const totalPrice = wirePrice + plugPrice + tailProcessingPrice
  return {
    wirePrice: parseFloat(wirePrice.toFixed(4)),
    plugPrice: parseFloat(plugPrice.toFixed(2)),
    tailProcessingPrice: parseFloat(tailProcessingPrice.toFixed(2)),
    unitPrice: parseFloat(totalPrice.toFixed(4))
  }
}

export function calculateProductById(id) {
  const product = getProductById(id)
  if (!product) {
    throw new Error('Product not found')
  }
  
  const wireSpec = product.wireSpec
  let wireUnitPrice = 0
  
  if (wireSpec) {
    const specs = query('SELECT * FROM wire_specs WHERE spec = ?', [wireSpec])
    if (specs.length > 0) {
      wireUnitPrice = specs[0].price || 0
    }
  }
  
  const result = calculateProductPrice({
    wireUnitPrice,
    length: product.length || 1,
    plugPrice: product.plugPrice || 0,
    tailProcessingPrice: product.tailProcessingPrice || 0
  })
  
  query(`
    UPDATE products 
    SET wire_unit_price = ?, unit_price = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [wireUnitPrice, result.unitPrice, id])
  
  return { ...product, ...result, wireUnitPrice }
}

export function calculateAllProducts() {
  const products = query('SELECT id FROM products WHERE status = "active"')
  let count = 0
  for (const prod of products) {
    try {
      calculateProductById(prod.id)
      count++
    } catch (e) {
      console.error(`Failed to calculate product ${prod.id}:`, e)
    }
  }
  return count
}

export function getCustomers(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(customer_code LIKE ? OR name LIKE ? OR contact_person LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  if (params.customerType) {
    conditions.push(`customer_type = ?`)
    queryParams.push(params.customerType)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM customers ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))

  return { data: convertedRows, total: countResult[0]?.total || 0 }
}

export function getCustomerById(id) {
  const row = query('SELECT * FROM customers WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createCustomer(customer) {
  const result = query(`
    INSERT INTO customers (customer_code, name, full_name, customer_type, contact_person, phone, email, address, shipping_address, payment_method, payment_days, credit_limit, used_credit, tax_rate, tax_no, bank_name, bank_account, remarks, status, source_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    customer.customerNo || customer.customer_code,
    customer.name,
    customer.fullName || customer.full_name || '',
    customer.customerType || customer.customer_type || '',
    customer.contactPerson || customer.contact_person,
    customer.phone,
    customer.email || '',
    customer.address || '',
    customer.shippingAddress || customer.shipping_address || '',
    customer.paymentMethod || customer.payment_method || '',
    customer.paymentDays || customer.payment_days || 0,
    customer.creditLimit || customer.credit_limit || 0,
    customer.usedCredit || customer.used_credit || 0,
    customer.taxRate || customer.tax_rate || 0,
    customer.taxNo || customer.tax_no || '',
    customer.bankName || customer.bank_name || '',
    customer.bankAccount || customer.bank_account || '',
    customer.remarks || customer.remarks || '',
    customer.status || 'active',
    customer.sourceSystem || customer.source_system || 'SQS'
  ])
  return { id: result.lastInsertRowid, ...customer }
}

export function updateCustomer(id, customer) {
  query(`
    UPDATE customers SET customer_code = ?, name = ?, full_name = ?, customer_type = ?, contact_person = ?, phone = ?, email = ?, address = ?, shipping_address = ?, payment_method = ?, payment_days = ?, credit_limit = ?, used_credit = ?, tax_rate = ?, tax_no = ?, bank_name = ?, bank_account = ?, remarks = ?, status = ?, source_system = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [
    customer.customerNo || customer.customer_code,
    customer.name,
    customer.fullName || customer.full_name || '',
    customer.customerType || customer.customer_type || '',
    customer.contactPerson || customer.contact_person,
    customer.phone,
    customer.email || '',
    customer.address || '',
    customer.shippingAddress || customer.shipping_address || '',
    customer.paymentMethod || customer.payment_method || '',
    customer.paymentDays || customer.payment_days || 0,
    customer.creditLimit || customer.credit_limit || 0,
    customer.usedCredit || customer.used_credit || 0,
    customer.taxRate || customer.tax_rate || 0,
    customer.taxNo || customer.tax_no || '',
    customer.bankName || customer.bank_name || '',
    customer.bankAccount || customer.bank_account || '',
    customer.remarks || customer.remarks || '',
    customer.status || 'active',
    customer.sourceSystem || customer.source_system || 'SQS',
    id
  ])
  return { id, ...customer }
}

export function deleteCustomer(id) {
  query('DELETE FROM customers WHERE id = ?', [id])
  return true
}

export function getSuppliers(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(supplier_code LIKE ? OR company_name LIKE ? OR contact_person LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM suppliers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM suppliers ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))

  return { data: convertedRows, total: countResult[0]?.total || 0 }
}

export function getSupplierById(id) {
  const row = query('SELECT * FROM suppliers WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createSupplier(supplier) {
  const result = query(`
    INSERT INTO suppliers (supplier_code, company_name, unified_social_credit_code, contact_person, contact_phone, address, bank_name, bank_account, tax_type, payment_terms, status, source_system, remark, rating, category, qualification_level, certified_at, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [supplier.supplier_code, supplier.company_name, supplier.unified_social_credit_code, supplier.contact_person, supplier.contact_phone, supplier.address, supplier.bank_name, supplier.bank_account, supplier.tax_type || 'general', supplier.payment_terms, supplier.status || 'pending', supplier.source_system || 'SQS', supplier.remark, supplier.rating || 0, supplier.category || '', supplier.qualification_level || '', supplier.certified_at || null, supplier.expiry_date || null])
  return { id: result.lastInsertRowid, ...supplier }
}

export function updateSupplier(id, supplier) {
  query(`
    UPDATE suppliers SET supplier_code = ?, company_name = ?, unified_social_credit_code = ?, contact_person = ?, contact_phone = ?, address = ?, bank_name = ?, bank_account = ?, tax_type = ?, payment_terms = ?, status = ?, source_system = ?, remark = ?, rating = ?, category = ?, qualification_level = ?, certified_at = ?, expiry_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [supplier.supplier_code, supplier.company_name, supplier.unified_social_credit_code, supplier.contact_person, supplier.contact_phone, supplier.address, supplier.bank_name, supplier.bank_account, supplier.tax_type, supplier.payment_terms, supplier.status, supplier.source_system, supplier.remark, supplier.rating || 0, supplier.category || '', supplier.qualification_level || '', supplier.certified_at || null, supplier.expiry_date || null, id])
  return { id, ...supplier }
}

export function deleteSupplier(id) {
  query('DELETE FROM suppliers WHERE id = ?', [id])
  return true
}

export function getInventory(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(material_id IN (SELECT id FROM materials WHERE material_code LIKE ? OR material_name LIKE ?))`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT i.*, m.material_code, m.material_name, m.specification FROM inventory i LEFT JOIN materials m ON i.material_id = m.id ${whereClause} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM inventory i ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))

  return { data: convertedRows, total: countResult[0]?.total || 0 }
}

export function getInventoryByMaterialId(materialId) {
  const row = query('SELECT * FROM inventory WHERE material_id = ?', [materialId])[0]
  return row ? convertToCamelCase(row) : null
}

export function createInventoryRecord(record) {
  const result = query(`
    INSERT INTO inventory_records (material_id, inventory_id, record_type, quantity, before_quantity, after_quantity, reference_type, reference_id, operator_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [record.material_id, record.inventory_id, record.record_type, record.quantity, record.before_quantity || 0, record.after_quantity || 0, record.reference_type, record.reference_id, record.operator_id, record.remark])
  return { id: result.lastInsertRowid, ...record }
}

export function getQuotes(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(q.quote_number LIKE ? OR q.customer_id IN (SELECT id FROM customers WHERE name LIKE ?))`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`q.status = ?`)
    queryParams.push(params.status)
  }

  // 支持 customerId 或 customerCode
  if (params.customerId) {
    conditions.push(`q.customer_id = ?`)
    queryParams.push(params.customerId)
  } else if (params.customerCode) {
    // 通过 customerCode 查询对应的 customer id
    const customer = query('SELECT id FROM customers WHERE customer_code = ?', [params.customerCode])[0]
    if (customer) {
      conditions.push(`q.customer_id = ?`)
      queryParams.push(customer.id)
    }
  }

  // 报价人筛选
  if (params.salespersonId) {
    conditions.push(`q.salesperson_id = ?`)
    queryParams.push(params.salespersonId)
  }

  // 日期范围筛选
  if (params.startDate) {
    conditions.push(`q.quote_date >= ?`)
    queryParams.push(params.startDate.split('T')[0])
  }
  if (params.endDate) {
    conditions.push(`q.quote_date <= ?`)
    queryParams.push(params.endDate.split('T')[0])
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT q.*, c.name as customer_name, u.name as salesperson_name FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id LEFT JOIN users u ON q.salesperson_id = u.id ${whereClause} ORDER BY q.created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM quotes q ${whereClause}`, queryParams)
  const convertedRows = rows.map(row => {
    const camelRow = convertToCamelCase(row)
    // 添加客户对象，方便前端渲染
    camelRow.customer = {
      name: camelRow.customerName || '',
      code: ''
    }
    // 添加报价人对象，方便前端渲染
    camelRow.salesperson = {
      name: camelRow.salespersonName || '',
      id: camelRow.salespersonId || ''
    }
    return camelRow
  })

  // 同时返回 data 和 quotes 两种格式，兼容不同前端需求
  return { 
    quotes: convertedRows, 
    data: convertedRows,
    total: countResult[0]?.total || 0 
  }
}

export function getQuoteById(id) {
  const row = query(`
    SELECT q.*, c.name as customer_name, c.customer_code as customer_code, c.contact_person as customer_contact, c.phone as customer_phone, c.address as customer_address,
           u.name as salesperson_name, u.username as salesperson_username
    FROM quotes q 
    LEFT JOIN customers c ON q.customer_id = c.id 
    LEFT JOIN users u ON q.salesperson_id = u.id 
    WHERE q.id = ?`, [id])[0]
  
  if (!row) return null
  
  const converted = convertToCamelCase(row)
  
  // 添加客户对象
  if (converted.customerName) {
    converted.customer = {
      id: converted.customerId,
      name: converted.customerName,
      code: converted.customerCode,
      contactPerson: converted.customerContact,
      phone: converted.customerPhone,
      address: converted.customerAddress
    }
  } else {
    converted.customer = null
  }
  
  // 添加报价人对象
  if (converted.salespersonName) {
    converted.salesperson = {
      id: converted.salespersonId,
      name: converted.salespersonName,
      username: converted.salespersonUsername
    }
  } else {
    converted.salesperson = null
  }
  
  // 添加明细项
  converted.items = getQuoteItems(id)
  
  // 计算总价
  const subtotal = converted.items.reduce((sum, item) => sum + (item.amount || item.totalPrice || 0), 0)
  if (!converted.totalAmount) {
    converted.totalAmount = subtotal + (converted.taxAmount || 0)
  }
  
  return converted
}

export function getQuoteItems(quoteId) {
  const rows = query('SELECT qi.*, m.material_code, m.product_name as material_name FROM quote_items qi LEFT JOIN products m ON qi.material_id = m.id WHERE qi.quote_id = ?', [quoteId])
  return rows.map(row => {
    const converted = convertToCamelCase(row)
    // 映射字段名
    converted.description = converted.productName || ''
    converted.amount = converted.totalPrice || 0
    return converted
  })
}

export function getNextQuoteNumber() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const prefix = `Q${year}${month}`

  const lastQuote = query(`SELECT quote_number FROM quotes WHERE quote_number LIKE ? ORDER BY id DESC LIMIT 1`, [`${prefix}%`])[0]

  if (lastQuote) {
    const lastNum = parseInt(lastQuote.quote_number.replace(prefix, ''))
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
  }
  return `${prefix}0001`
}

export function createQuote(data) {
  const quoteNumber = data.quoteNumber || getNextQuoteNumber()

  console.log('createQuote - 接收到的数据:', JSON.stringify(data, null, 2))

  // 处理 customerId - 如果是 customerCode，需要查询对应的 customer id
  let customerId = data.customerId || null
  if (!customerId && data.customerCode) {
    console.log('createQuote - 通过 customerCode 查询:', data.customerCode)
    const customer = query('SELECT id, customer_code FROM customers WHERE customer_code = ?', [data.customerCode])[0]
    console.log('createQuote - 查询到的客户:', customer)
    if (customer) {
      customerId = customer.id
    } else {
      console.error('createQuote - 未找到客户, customerCode:', data.customerCode)
    }
  }

  // 处理 salespersonId - 如果是 salespersonCode，需要查询对应的 user id
  let salespersonId = data.salespersonId || null
  if (!salespersonId && data.salespersonCode) {
    const user = query('SELECT id FROM users WHERE username = ? OR name = ?', [data.salespersonCode, data.salespersonCode])[0]
    if (user) {
      salespersonId = user.id
    }
  }

  console.log('createQuote - 最终 customerId:', customerId, 'salespersonId:', salespersonId)

  try {
    const result = query(`
      INSERT INTO quotes (quote_number, customer_id, salesperson_id, quote_date, valid_until, currency, subtotal, tax_rate, tax_amount, total_amount, profit_margin, status, remark, source_system)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quoteNumber,
      customerId,
      salespersonId,
      data.quoteDate || new Date().toISOString().split('T')[0],
      data.validUntil || null,
      data.currency || 'CNY',
      data.subtotal || 0,
      data.taxRate || 13,
      data.taxAmount || 0,
      data.totalAmount || 0,
      data.profitMargin || 0,
      data.status || 'draft',
      data.remark || data.notes || '',
      data.sourceSystem || 'SQS'
    ])

    const quoteId = result.lastInsertRowid
    console.log('createQuote - 报价单创建成功, quoteId:', quoteId)

    // 插入报价明细
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        console.log(`createQuote - 插入第 ${index + 1} 条明细:`, JSON.stringify(item))
        query(`
          INSERT INTO quote_items (quote_id, material_id, product_name, specification, unit, quantity, unit_price, total_price, delivery_date, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          quoteId,
          item.materialId || null,
          item.description || item.product_name || '',
          item.specification || item.wireSpec || '',
          item.unit || 'pcs',
          item.quantity || 1,
          item.unitPrice || 0,
          item.amount || item.total_price || 0,
          item.deliveryDate || null,
          item.remarks || ''
        ])
      })
    }

    return { id: quoteId, quoteNumber, ...data }
  } catch (error) {
    console.error('createQuote - 数据库错误:', error.message)
    console.error('createQuote - 错误详情:', error)
    throw error
  }
}

export function updateQuote(id, data) {
  query(`
    UPDATE quotes SET
      customer_id = ?,
      salesperson_id = ?,
      quote_date = ?,
      valid_until = ?,
      currency = ?,
      subtotal = ?,
      tax_rate = ?,
      tax_amount = ?,
      total_amount = ?,
      profit_margin = ?,
      status = ?,
      remark = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `, [
    data.customerId || null,
    data.salespersonId || null,
    data.quoteDate || new Date().toISOString().split('T')[0],
    data.validUntil || null,
    data.currency || 'CNY',
    data.subtotal || 0,
    data.taxRate || 13,
    data.taxAmount || 0,
    data.totalAmount || 0,
    data.profitMargin || 0,
    data.status || 'draft',
    data.notes || '',
    id
  ])

  // 更新报价明细
  if (data.items !== undefined) {
    query('DELETE FROM quote_items WHERE quote_id = ?', [id])
    if (data.items.length > 0) {
      data.items.forEach((item) => {
        query(`
          INSERT INTO quote_items (quote_id, material_id, product_name, specification, unit, quantity, unit_price, total_price, delivery_date, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.materialId || null,
          item.description || '',
          item.specification || '',
          item.unit || 'pcs',
          item.quantity || 1,
          item.unitPrice || 0,
          item.amount || 0,
          item.deliveryDate || null,
          item.remarks || ''
        ])
      })
    }
  }

  return getQuoteById(id)
}

export function updateQuoteItems(quoteId, items) {
  query('DELETE FROM quote_items WHERE quote_id = ?', [quoteId])
  if (items && items.length > 0) {
    items.forEach((item) => {
      query(`
        INSERT INTO quote_items (quote_id, material_id, product_name, specification, unit, quantity, unit_price, total_price, delivery_date, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        quoteId,
        item.materialId || null,
        item.description || '',
        item.specification || '',
        item.unit || 'pcs',
        item.quantity || 1,
        item.unitPrice || 0,
        item.amount || 0,
        item.deliveryDate || null,
        item.remarks || ''
      ])
    })
  }
  return true
}

export function copyQuote(id) {
  const original = getQuoteById(id)
  if (!original) return null

  const newQuoteNumber = getNextQuoteNumber()

  const result = query(`
    INSERT INTO quotes (quote_number, customer_id, salesperson_id, quote_date, valid_until, currency, subtotal, tax_rate, tax_amount, total_amount, profit_margin, status, remark, source_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    newQuoteNumber,
    original.customerId,
    original.salespersonId,
    new Date().toISOString().split('T')[0],
    null,
    original.currency || 'CNY',
    original.subtotal,
    original.taxRate,
    original.taxAmount,
    original.totalAmount,
    original.profitMargin,
    'draft',
    `复制自 ${original.quoteNumber}`,
    'SQS'
  ])

  const newQuoteId = result.lastInsertRowid

  // 复制报价明细
  const items = getQuoteItems(id)
  items.forEach((item) => {
    query(`
      INSERT INTO quote_items (quote_id, material_id, product_name, specification, unit, quantity, unit_price, total_price, delivery_date, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newQuoteId,
      item.materialId,
      item.productName || item.description,
      item.specification,
      item.unit,
      item.quantity,
      item.unitPrice,
      item.totalPrice || item.amount,
      item.deliveryDate,
      item.remark || ''
    ])
  })

  return { id: newQuoteId, quoteNumber: newQuoteNumber }
}

export function deleteQuote(id) {
  query('DELETE FROM quote_items WHERE quote_id = ?', [id])
  query('DELETE FROM quotes WHERE id = ?', [id])
  return true
}

function convertToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const result = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      result[camelCaseKey] = obj[key]
    }
  }
  return result
}

export function getWireSpecs(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(spec LIKE ? OR material_type LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = query(`SELECT * FROM wire_specs ${whereClause} ORDER BY spec`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))
  return { data: convertedRows, total: convertedRows.length }
}

export function deleteWireSpec(spec) {
  query('DELETE FROM wire_specs WHERE spec = ?', [spec])
  return true
}

export function getWireSpecBySpec(spec) {
  return query('SELECT * FROM wire_specs WHERE spec = ?', [spec])[0]
}

export function createWireSpec(data) {
  const stmt = query(`
    INSERT INTO wire_specs (spec, price, copper_weight, material_weight, filler_weight, material_type, outer_diameter, weight_per_meter, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [data.spec, data.price || 0, data.copperWeight || 0, data.materialWeight || 0, data.fillerWeight || 0, data.materialType || '', data.outerDiameter || 0, data.weightPerMeter || 0, data.status || 'active', data.remark || ''])
  return stmt.lastInsertRowid
}

export function updateWireSpec(spec, data) {
  query(`
    UPDATE wire_specs SET 
      price = ?, copper_weight = ?, material_weight = ?, filler_weight = ?, material_type = ?, 
      outer_diameter = ?, weight_per_meter = ?, 
      copper_cost = ?, material_cost = ?, filler_cost = ?, base_price = ?, final_price = ?,
      profit_margin = ?, copper_price_per_ton = ?, copper_process_fee = ?, 
      material_price_per_ton = ?, filler_price_per_ton = ?,
      status = ?, remark = ?, updated_at = datetime('now')
    WHERE spec = ?
  `, [
    data.price || 0, 
    data.copperWeight || 0, 
    data.materialWeight || 0, 
    data.fillerWeight || 0, 
    data.materialType || '', 
    data.outerDiameter || 0, 
    data.weightPerMeter || 0,
    data.copperCost || 0,
    data.materialCost || 0,
    data.fillerCost || 0,
    data.basePrice || 0,
    data.finalPrice || 0,
    data.profitMargin || 0.85,
    data.copperPricePerTon || 0,
    data.copperProcessFee || 0,
    data.materialPricePerTon || 0,
    data.fillerPricePerTon || 0,
    data.status || 'active', 
    data.remark || '', 
    spec
  ])
  return getWireSpecBySpec(spec)
}

export function getPlugs(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(plug_code LIKE ? OR name LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = query(`SELECT * FROM plugs ${whereClause} ORDER BY name`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))
  return { data: convertedRows, total: convertedRows.length }
}

export function deletePlug(id) {
  query('DELETE FROM plugs WHERE id = ?', [id])
  return true
}

export function getPlugById(id) {
  const row = query('SELECT * FROM plugs WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createPlug(data) {
  const stmt = query(`
    INSERT INTO plugs (plug_code, name, price, currency, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.plugCode || data.name, data.name, data.price || 0, data.currency || 'CNY', data.description || '', data.status || 'active'])
  return stmt.lastInsertRowid
}

export function updatePlug(id, data) {
  query(`
    UPDATE plugs SET 
      plug_code = ?, name = ?, price = ?, currency = ?, description = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [data.plugCode || data.name, data.name, data.price || 0, data.currency || 'CNY', data.description || '', data.status || 'active', id])
  return getPlugById(id)
}

export function getTailProcessings(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(process_code LIKE ? OR name LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = query(`SELECT * FROM tail_processings ${whereClause} ORDER BY name`, queryParams)
  const convertedRows = rows.map(row => convertToCamelCase(row))
  return { data: convertedRows, total: convertedRows.length }
}

export function deleteTailProcessing(id) {
  query('DELETE FROM tail_processings WHERE id = ?', [id])
  return true
}

export function getTailProcessingById(id) {
  const row = query('SELECT * FROM tail_processings WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createTailProcessing(data) {
  const stmt = query(`
    INSERT INTO tail_processings (process_code, name, price, currency, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.processCode || data.name, data.name, data.price || 0, data.currency || 'CNY', data.description || '', data.status || 'active'])
  return stmt.lastInsertRowid
}

export function updateTailProcessing(id, data) {
  query(`
    UPDATE tail_processings SET 
      process_code = ?, name = ?, price = ?, currency = ?, description = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [data.processCode || data.name, data.name, data.price || 0, data.currency || 'CNY', data.description || '', data.status || 'active', id])
  return getTailProcessingById(id)
}

export function getSalespersons(params = {}) {
  const conditions = []
  const queryParams = []

  conditions.push(`role_id = (SELECT id FROM roles WHERE name = 'salesperson')`)

  if (params.search) {
    conditions.push(`(username LIKE ? OR name LIKE ? OR email LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = query(`SELECT id, username, name, email, phone, department, status, created_at FROM users ${whereClause} ORDER BY created_at DESC`, queryParams)
  return { data: rows, total: rows.length }
}

export function createSalesperson(salesperson) {
  const roleId = query('SELECT id FROM roles WHERE name = ?', ['salesperson'])[0]?.id || 3
  const result = query(`
    INSERT INTO users (username, password, name, email, phone, department, role_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [salesperson.username, salesperson.password || '', salesperson.name, salesperson.email || '', salesperson.phone || '', salesperson.department || '', roleId, salesperson.status || 'active'])
  return { id: result.lastInsertRowid, ...salesperson }
}

export function updateSalesperson(id, salesperson) {
  const fields = []
  const values = []

  if (salesperson.username !== undefined) { fields.push('username = ?'); values.push(salesperson.username) }
  if (salesperson.password !== undefined) { fields.push('password = ?'); values.push(salesperson.password) }
  if (salesperson.name !== undefined) { fields.push('name = ?'); values.push(salesperson.name) }
  if (salesperson.email !== undefined) { fields.push('email = ?'); values.push(salesperson.email) }
  if (salesperson.phone !== undefined) { fields.push('phone = ?'); values.push(salesperson.phone) }
  if (salesperson.department !== undefined) { fields.push('department = ?'); values.push(salesperson.department) }
  if (salesperson.status !== undefined) { fields.push('status = ?'); values.push(salesperson.status) }
  
  if (fields.length > 0) {
    query(`UPDATE users SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`, [...values, id])
  }
  return { id, ...salesperson }
}

export function deleteSalesperson(id) {
  query('DELETE FROM users WHERE id = ?', [id])
  return true
}

export function batchDeleteSalespersons(ids) {
  if (ids.length === 0) return true
  const placeholders = ids.map(() => '?').join(',')
  query(`DELETE FROM users WHERE id IN (${placeholders})`, ids)
  return true
}

export function getSettings(params = {}) {
  if (params.category) {
    return query('SELECT * FROM settings WHERE category = ? ORDER BY setting_key', [params.category])
  }
  return query('SELECT * FROM settings ORDER BY category, setting_key')
}

export function getSetting(key) {
  const rows = query('SELECT * FROM settings WHERE setting_key = ?', [key])
  return rows[0] || null
}

export function upsertSetting(key, value, category = 'general') {
  const existing = getSetting(key)
  if (existing) {
    query('UPDATE settings SET setting_value = ?, updated_at = datetime("now") WHERE setting_key = ?', [value, key])
  } else {
    query('INSERT INTO settings (setting_key, setting_value, category) VALUES (?, ?, ?)', [key, value, category])
  }
  return { setting_key: key, setting_value: value, category }
}

export function getUsers(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(username LIKE ? OR name LIKE ? OR email LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = query(`SELECT id, username, name, email, phone, department, role_id, status, last_login, created_at FROM users ${whereClause} ORDER BY created_at DESC`, queryParams)
  const convertedRows = rows.map(row => {
    const converted = convertToCamelCase(row)
    if (converted.roleId !== undefined) {
      converted.role = converted.roleId
      delete converted.roleId
    }
    return converted
  })
  return { data: convertedRows, total: convertedRows.length }
}

export function getUserByUsername(username) {
  const row = query('SELECT * FROM users WHERE username = ?', [username])[0]
  return row ? convertToCamelCase(row) : null
}

export function getUserById(id) {
  const row = query('SELECT * FROM users WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createUser(user) {
  const roleId = user.role_id || user.role
  const result = query(`
    INSERT INTO users (username, password, name, email, phone, department, role_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [user.username, user.password, user.name, user.email, user.phone, user.department, roleId, user.status || 'active'])
  return { id: result.lastInsertRowid, ...user }
}

export function updateUser(id, user) {
  const roleId = user.role_id || user.role
  query(`
    UPDATE users SET username = ?, password = ?, name = ?, email = ?, phone = ?, department = ?, role_id = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [user.username || '', user.password || '', user.name || '', user.email || '', user.phone || '', user.department || '', roleId || '', user.status || 'active', id])
  return { id, ...user }
}

export function deleteUser(id) {
  query('DELETE FROM users WHERE id = ?', [id])
}

export function updateUserPassword(id, newPassword) {
  query('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?', [newPassword, id])
}

export function getRoles() {
  const rows = query('SELECT * FROM roles ORDER BY id')
  return rows.map(row => {
    const converted = convertToCamelCase(row)
    if (converted.permissions && typeof converted.permissions === 'string') {
      try {
        converted.permissions = JSON.parse(converted.permissions)
      } catch {
        converted.permissions = []
      }
    }
    return converted
  })
}

export function getRoleById(id) {
  const rows = query('SELECT * FROM roles WHERE id = ?', [id])
  return rows[0] || null
}

export function createRole(role) {
  query('INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)', [role.id, role.name, role.description, JSON.stringify(role.permissions || [])])
  return role
}

export function updateRole(id, role) {
  query('UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?', [role.name, role.description, JSON.stringify(role.permissions || []), id])
  return { id, ...role }
}

export function deleteRole(id) {
  query('DELETE FROM roles WHERE id = ?', [id])
}

export const PERMISSIONS = [
  { id: 'system_settings', name: '系统设置', description: '管理系统基础设置' },
  { id: 'role_manage', name: '角色管理', description: '管理系统角色' },
  { id: 'user_manage', name: '用户管理', description: '管理系统用户' },
  { id: 'customer_manage', name: '客户管理', description: '管理客户信息' },
  { id: 'quote_create', name: '报价单创建', description: '创建报价单' },
  { id: 'quote_view', name: '报价单查看', description: '查看报价单' },
  { id: 'quote_edit', name: '报价单编辑', description: '编辑报价单' },
  { id: 'quote_delete', name: '报价单删除', description: '删除报价单' },
  { id: 'product_manage', name: '产品管理', description: '管理产品信息' },
  { id: 'material_manage', name: '物料管理', description: '管理物料信息' },
  { id: 'plug_manage', name: '插头管理', description: '管理插头价格' },
  { id: 'wire_spec_manage', name: '电线规格管理', description: '管理电线规格' },
  { id: 'tail_processing_manage', name: '尾部处理管理', description: '管理尾部处理' },
  { id: 'inventory_view', name: '库存查看', description: '查看库存信息' },
  { id: 'report_view', name: '报表查看', description: '查看报表数据' }
]

export function getPermissions() {
  return PERMISSIONS
}

export function getSupplierAccounts(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(supplier_code LIKE ? OR company_name LIKE ? OR login_email LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM supplier_accounts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM supplier_accounts ${whereClause}`, queryParams)

  return { data: rows, total: countResult[0]?.total || 0 }
}

export function getSupplierAccountById(id) {
  const rows = query('SELECT * FROM supplier_accounts WHERE id = ?', [id])
  return rows[0] || null
}

export function getSupplierAccountByEmail(loginEmail) {
  const rows = query('SELECT * FROM supplier_accounts WHERE login_email = ?', [loginEmail])
  return rows[0] || null
}

export function createSupplierAccount(account) {
  const result = query(`
    INSERT INTO supplier_accounts (supplier_code, login_email, password, company_name, unified_social_credit_code, tax_type, contact_person, contact_phone, address, bank_name, bank_account, status, review_status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [account.supplier_code, account.login_email, account.password, account.company_name, account.unified_social_credit_code, account.tax_type || 'general', account.contact_person, account.contact_phone, account.address, account.bank_name, account.bank_account, account.status || 'pending_activation', account.review_status || 'pending', account.remark])
  return { id: result.lastInsertRowid, ...account }
}

export function updateSupplierAccount(id, account) {
  query(`
    UPDATE supplier_accounts SET supplier_code = ?, login_email = ?, company_name = ?, unified_social_credit_code = ?, tax_type = ?, contact_person = ?, contact_phone = ?, address = ?, bank_name = ?, bank_account = ?, remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [account.supplier_code, account.login_email, account.company_name, account.unified_social_credit_code, account.tax_type, account.contact_person, account.contact_phone, account.address, account.bank_name, account.bank_account, account.remark, id])
  return getSupplierAccountById(id)
}

export function deleteSupplierAccount(id) {
  query('DELETE FROM supplier_sub_accounts WHERE supplier_account_id = ?', [id])
  query('DELETE FROM supplier_accounts WHERE id = ?', [id])
  return true
}

export function batchDeleteSupplierAccounts(ids) {
  ids.forEach(id => {
    query('DELETE FROM supplier_sub_accounts WHERE supplier_account_id = ?', [id])
    query('DELETE FROM supplier_accounts WHERE id = ?', [id])
  })
  return true
}

export function reviewSupplierAccount(id, result, remark = '') {
  const status = result === 'approved' ? 'active' : 'pending_activation'
  query(`
    UPDATE supplier_accounts SET review_status = ?, status = ?, remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [result, status, remark, id])
  return getSupplierAccountById(id)
}

export function freezeSupplierAccount(id) {
  query('UPDATE supplier_accounts SET status = ?, updated_at = datetime("now") WHERE id = ?', ['temporary_frozen', id])
  return getSupplierAccountById(id)
}

export function unfreezeSupplierAccount(id) {
  query('UPDATE supplier_accounts SET status = ?, updated_at = datetime("now") WHERE id = ?', ['active', id])
  return getSupplierAccountById(id)
}

export function disableSupplierAccount(id, reason = '') {
  query('UPDATE supplier_accounts SET status = ?, remark = ?, updated_at = datetime("now") WHERE id = ?', ['disabled', reason, id])
  return getSupplierAccountById(id)
}

export function resetSupplierAccountPassword(id, newPassword) {
  query('UPDATE supplier_accounts SET password = ?, updated_at = datetime("now") WHERE id = ?', [newPassword, id])
  return { success: true, newPassword }
}

export function getSupplierAccountStats() {
  const stats = {}
  
  const total = query('SELECT COUNT(*) as count FROM supplier_accounts')[0]?.count || 0
  const active = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE status = ?', ['active'])[0]?.count || 0
  const pendingActivation = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE status = ?', ['pending_activation'])[0]?.count || 0
  const pendingReview = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE review_status = ?', ['pending'])[0]?.count || 0
  const frozen = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE status = ?', ['temporary_frozen'])[0]?.count || 0
  const disabled = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE status = ?', ['disabled'])[0]?.count || 0
  const cancelled = query('SELECT COUNT(*) as count FROM supplier_accounts WHERE status = ?', ['cancelled'])[0]?.count || 0
  const totalSubAccounts = query('SELECT COUNT(*) as count FROM supplier_sub_accounts')[0]?.count || 0
  const activeSubAccounts = query('SELECT COUNT(*) as count FROM supplier_sub_accounts WHERE status = ?', ['active'])[0]?.count || 0

  return {
    total,
    active,
    pendingActivation,
    pendingReview,
    frozen,
    disabled,
    cancelled,
    totalSubAccounts,
    activeSubAccounts
  }
}

export function getSupplierSubAccounts(supplierAccountId) {
  const rows = query('SELECT * FROM supplier_sub_accounts WHERE supplier_account_id = ? ORDER BY created_at DESC', [supplierAccountId])
  return { data: rows, total: rows.length }
}

export function getSupplierSubAccountById(id) {
  const rows = query('SELECT * FROM supplier_sub_accounts WHERE id = ?', [id])
  return rows[0] || null
}

export function createSupplierSubAccount(subAccount) {
  const result = query(`
    INSERT INTO supplier_sub_accounts (supplier_account_id, login_email, password, contact_person, contact_phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [subAccount.supplier_account_id, subAccount.login_email, subAccount.password, subAccount.contact_person, subAccount.contact_phone, subAccount.role, subAccount.status || 'active'])
  return { id: result.lastInsertRowid, ...subAccount }
}

export function updateSupplierSubAccount(id, subAccount) {
  query(`
    UPDATE supplier_sub_accounts SET login_email = ?, contact_person = ?, contact_phone = ?, role = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [subAccount.login_email, subAccount.contact_person, subAccount.contact_phone, subAccount.role, subAccount.status, id])
  return getSupplierSubAccountById(id)
}

export function deleteSupplierSubAccount(id) {
  query('DELETE FROM supplier_sub_accounts WHERE id = ?', [id])
  return true
}

export function updateSupplierSubAccountStatus(id, status) {
  query('UPDATE supplier_sub_accounts SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, id])
  return getSupplierSubAccountById(id)
}

export function getContracts(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(contract_number LIKE ? OR contract_name LIKE ? OR supplier_name LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM contracts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM contracts ${whereClause}`, queryParams)

  return { data: rows, total: countResult[0]?.total || 0 }
}

export function getContractById(id) {
  const rows = query('SELECT * FROM contracts WHERE id = ?', [id])
  return rows[0] || null
}

export function createContract(contract) {
  const result = query(`
    INSERT INTO contracts (contract_number, contract_name, supplier_code, supplier_name, sign_date, expire_date, amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [contract.contract_number, contract.contract_name, contract.supplier_code, contract.supplier_name, contract.sign_date, contract.expire_date, contract.amount || 0, contract.status || 'active'])
  return { id: result.lastInsertRowid, ...contract }
}

export function updateContract(id, contract) {
  query(`
    UPDATE contracts SET contract_number = ?, contract_name = ?, supplier_code = ?, supplier_name = ?, sign_date = ?, expire_date = ?, amount = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [contract.contract_number, contract.contract_name, contract.supplier_code, contract.supplier_name, contract.sign_date, contract.expire_date, contract.amount, contract.status, id])
  return { id, ...contract }
}

export function deleteContract(id) {
  query('DELETE FROM contracts WHERE id = ?', [id])
  return true
}

export function getSupplierPerformance(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(supplier_code LIKE ? OR supplier_name LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM supplier_performance ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM supplier_performance ${whereClause}`, queryParams)

  return { data: rows, total: countResult[0]?.total || 0 }
}

export function getSupplierPerformanceById(id) {
  const rows = query('SELECT * FROM supplier_performance WHERE id = ?', [id])
  return rows[0] || null
}

export function updateSupplierPerformance(id, performance) {
  query(`
    UPDATE supplier_performance SET delivery_rate = ?, quality_score = ?, response_time = ?, total_orders = ?, total_amount = ?, overall_rating = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [performance.delivery_rate, performance.quality_score, performance.response_time, performance.total_orders, performance.total_amount, performance.overall_rating, id])
  return { id, ...performance }
}

export function getPurchaseOrders(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(order_number LIKE ? OR supplier_name LIKE ? OR material_name LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`)
  }

  if (params.status) {
    conditions.push(`status = ?`)
    queryParams.push(params.status)
  }

  if (params.supplier_code) {
    conditions.push(`supplier_code = ?`)
    queryParams.push(params.supplier_code)
  }

  if (params.supplier_name) {
    conditions.push(`supplier_name LIKE ?`)
    queryParams.push(`%${params.supplier_name}%`)
  }

  if (params.material_code) {
    conditions.push(`material_code = ?`)
    queryParams.push(params.material_code)
  }

  if (params.order_number) {
    conditions.push(`order_number LIKE ?`)
    queryParams.push(`%${params.order_number}%`)
  }

  if (params.start_date) {
    conditions.push(`created_at >= ?`)
    queryParams.push(`${params.start_date} 00:00:00`)
  }

  if (params.end_date) {
    conditions.push(`created_at <= ?`)
    queryParams.push(`${params.end_date} 23:59:59`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 20
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM purchase_orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM purchase_orders ${whereClause}`, queryParams)

  return { data: rows, total: countResult[0]?.total || 0 }
}

export function getPurchaseOrderById(id) {
  const rows = query('SELECT * FROM purchase_orders WHERE id = ?', [id])
  return rows[0] || null
}

export function getPurchaseOrderByNumber(orderNumber) {
  const rows = query('SELECT * FROM purchase_orders WHERE order_number = ?', [orderNumber])
  return rows[0] || null
}

export function updatePurchaseOrderStatus(orderNumber, status, confirmedDate = null) {
  const updateFields = ['status = ?']
  const updateParams = [status]

  if (confirmedDate) {
    updateFields.push('confirmed_date = ?')
    updateParams.push(confirmedDate)
  }

  updateFields.push('updated_at = datetime("now")')

  query(`UPDATE purchase_orders SET ${updateFields.join(', ')} WHERE order_number = ?`, [...updateParams, orderNumber])
  return getPurchaseOrderByNumber(orderNumber)
}

// ============ 导入功能 ============

import * as XLSX from 'xlsx'

export function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
  return jsonData
}

export function importWireSpecs(dataList) {
  const results = { success: 0, failed: 0, errors: [] }

  for (const item of dataList) {
    try {
      const spec = item['规格'] || item['spec'] || item['规格型号'] || ''
      const price = parseFloat(item['单价'] || item['price'] || item['价格'] || 0)
      const copperWeight = parseFloat(item['铜重'] || item['copper_weight'] || item['铜重量(g/m)'] || 0)
      const materialWeight = parseFloat(item['材料重'] || item['material_weight'] || item['材料重量(g/m)'] || 0)
      const fillerWeight = parseFloat(item['填充重'] || item['filler_weight'] || 0)
      const materialType = item['类型'] || item['material_type'] || item['材料类型'] || ''
      const outerDiameter = parseFloat(item['外径'] || item['outer_diameter'] || 0)
      const weightPerMeter = parseFloat(item['每米重量'] || item['weight_per_meter'] || 0)
      const status = (item['状态'] || item['status'] || 'active').toLowerCase()
      const remark = item['备注'] || item['remark'] || ''

      if (!spec) {
        results.failed++
        results.errors.push(`缺少规格字段`)
        continue
      }

      // 检查是否存在
      const existing = getWireSpecBySpec(spec)
      if (existing) {
        // 更新
        updateWireSpec(spec, {
          price,
          copperWeight,
          materialWeight,
          fillerWeight,
          materialType,
          outerDiameter,
          weightPerMeter,
          status: status === 'active' || status === '启用' ? 'active' : 'inactive',
          remark
        })
      } else {
        // 创建
        createWireSpec({
          spec,
          price,
          copperWeight,
          materialWeight,
          fillerWeight,
          materialType,
          outerDiameter,
          weightPerMeter,
          status: status === 'active' || status === '启用' ? 'active' : 'inactive',
          remark
        })
      }
      results.success++
    } catch (e) {
      results.failed++
      results.errors.push(`处理失败: ${e.message}`)
    }
  }

  return results
}

export function importPlugs(dataList) {
  const results = { success: 0, failed: 0, errors: [] }

  for (const item of dataList) {
    try {
      const model = item['型号'] || item['model'] || item['插头型号'] || ''
      const name = item['名称'] || item['name'] || item['插头名称'] || ''
      const type = item['类型'] || item['type'] || item['插头类型'] || ''
      const voltage = item['电压'] || item['voltage'] || item['额定电压'] || ''
      const current = item['电流'] || item['current'] || item['额定电流'] || ''
      const price = parseFloat(item['价格'] || item['price'] || item['单价'] || 0)
      const supplier = item['供应商'] || item['supplier'] || ''
      const status = (item['状态'] || item['status'] || 'active').toLowerCase()
      const remark = item['备注'] || item['remark'] || ''

      if (!model) {
        results.failed++
        results.errors.push(`缺少型号字段`)
        continue
      }

      // 检查是否存在
      const existing = query('SELECT id FROM plugs WHERE model = ?', [model])[0]
      if (existing) {
        query(`
          UPDATE plugs SET name = ?, type = ?, voltage = ?, current = ?, price = ?, supplier = ?, status = ?, remark = ? WHERE model = ?
        `, [name, type, voltage, current, price, supplier, status === 'active' || status === '启用' ? 'active' : 'inactive', remark, model])
      } else {
        query(`
          INSERT INTO plugs (model, name, type, voltage, current, price, supplier, status, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [model, name, type, voltage, current, price, supplier, status === 'active' || status === '启用' ? 'active' : 'inactive', remark])
      }
      results.success++
    } catch (e) {
      results.failed++
      results.errors.push(`处理失败: ${e.message}`)
    }
  }

  return results
}

export function importTailProcessings(dataList) {
  const results = { success: 0, failed: 0, errors: [] }

  for (const item of dataList) {
    try {
      const code = item['编码'] || item['code'] || item['处理编码'] || ''
      const name = item['名称'] || item['name'] || item['处理名称'] || ''
      const type = item['类型'] || item['type'] || item['处理类型'] || ''
      const unit = item['单位'] || item['unit'] || 'pcs'
      const price = parseFloat(item['价格'] || item['price'] || item['单价'] || 0)
      const description = item['描述'] || item['description'] || ''
      const status = (item['状态'] || item['status'] || 'active').toLowerCase()
      const remark = item['备注'] || item['remark'] || ''

      if (!name) {
        results.failed++
        results.errors.push(`缺少名称字段`)
        continue
      }

      // 检查是否存在（按名称查找）
      const existing = query('SELECT id FROM tail_processings WHERE name = ?', [name])[0]
      if (existing) {
        query(`
          UPDATE tail_processings SET code = ?, type = ?, unit = ?, price = ?, description = ?, status = ?, remark = ? WHERE name = ?
        `, [code, type, unit, price, description, status === 'active' || status === '启用' ? 'active' : 'inactive', remark, name])
      } else {
        query(`
          INSERT INTO tail_processings (code, name, type, unit, price, description, status, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [code, name, type, unit, price, description, status === 'active' || status === '启用' ? 'active' : 'inactive', remark])
      }
      results.success++
    } catch (e) {
      results.failed++
      results.errors.push(`处理失败: ${e.message}`)
    }
  }

  return results
}

export function createPurchaseOrder(order) {
  const result = query(`
    INSERT INTO purchase_orders (order_number, erp_order_number, supplier_code, supplier_name, material_code, material_name, specification, quantity, unit, unit_price, total_amount, delivery_date, status, quality_standard, warehouse, account, tax_rate, source_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    order.order_number,
    order.erp_order_number || '',
    order.supplier_code,
    order.supplier_name,
    order.material_code,
    order.material_name,
    order.specification || '',
    order.quantity || 0,
    order.unit || 'pcs',
    order.unit_price || 0,
    order.total_amount || 0,
    order.delivery_date,
    order.status || 'pending',
    order.quality_standard || '',
    order.warehouse || '',
    order.account || '',
    order.tax_rate || 0,
    order.source_system || 'erp'
  ])
  return { id: result.lastInsertRowid, ...order }
}

// 铜价管理
export function getCopperPrices(params = {}) {
  const conditions = []
  const queryParams = []

  if (params.search) {
    conditions.push(`(supplier LIKE ? OR remark LIKE ?)`)
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.startDate) {
    conditions.push(`DATE(created_at) >= ?`)
    queryParams.push(params.startDate)
  }

  if (params.endDate) {
    conditions.push(`DATE(created_at) <= ?`)
    queryParams.push(params.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageSize = params.pageSize || 100
  const offset = ((params.page || 1) - 1) * pageSize

  const rows = query(`SELECT * FROM copper_prices ${whereClause} ORDER BY is_current DESC, created_at DESC LIMIT ? OFFSET ?`, [...queryParams, pageSize, offset])
  const countResult = query(`SELECT COUNT(*) as total FROM copper_prices ${whereClause}`, queryParams)

  return { data: rows, total: countResult[0]?.total || 0 }
}

export function getCopperPriceById(id) {
  const rows = query('SELECT * FROM copper_prices WHERE id = ?', [id])
  return rows[0] || null
}

export function getCurrentCopperPrice() {
  const rows = query('SELECT * FROM copper_prices WHERE is_current = 1 LIMIT 1')
  return rows[0] || null
}

export function createCopperPrice(copperPrice) {
  const result = query(`
    INSERT INTO copper_prices (price, process_fee, supplier, effective_date, remark, is_current, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
  `, [
    copperPrice.price,
    copperPrice.processFee || copperPrice.process_fee || 4000,
    copperPrice.supplier || '',
    copperPrice.effectiveDate || copperPrice.effective_date || '',
    copperPrice.remark || ''
  ])
  return { id: result.lastInsertRowid, ...copperPrice }
}

export function updateCopperPrice(id, copperPrice) {
  query(`
    UPDATE copper_prices
    SET price = ?, process_fee = ?, supplier = ?, effective_date = ?, remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [
    copperPrice.price,
    copperPrice.processFee || copperPrice.process_fee || 4000,
    copperPrice.supplier || '',
    copperPrice.effectiveDate || copperPrice.effective_date || '',
    copperPrice.remark || '',
    id
  ])
  return { id, ...copperPrice }
}

export function deleteCopperPrice(id) {
  query('DELETE FROM copper_prices WHERE id = ?', [id])
  return true
}

export function setCurrentCopperPrice(id) {
  // 先将所有记录设为非当前
  query('UPDATE copper_prices SET is_current = 0')
  // 将指定记录设为当�?  query("UPDATE copper_prices SET is_current = 1, updated_at = datetime('now') WHERE id = ?", [id])
  return getCopperPriceById(id)
}

export default {
  getMaterials, getMaterialByCode, createMaterial, updateMaterial, deleteMaterial,
  getProducts, getProductById, getProductByCode, createProduct, updateProduct, deleteProduct, batchDeleteProducts, generateProductCode, parseProductWithPrice,
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier,
  getInventory, getInventoryByMaterialId, createInventoryRecord,
  getQuotes, getQuoteById, getQuoteItems,
  getWireSpecs, getWireSpecBySpec, createWireSpec, updateWireSpec, deleteWireSpec,
  getPlugs, getPlugById, createPlug, updatePlug, deletePlug,
  getTailProcessings, getTailProcessingById, createTailProcessing, updateTailProcessing, deleteTailProcessing,
  getSettings, getSetting, upsertSetting,
  getUsers, getUserByUsername, createUser, updateUser, deleteUser, updateUserPassword,
  getRoles, getRoleById, createRole, updateRole, deleteRole, getPermissions,
  getSalespersons, createSalesperson, updateSalesperson, deleteSalesperson, batchDeleteSalespersons,
  getSupplierAccounts, getSupplierAccountById, getSupplierAccountByEmail, createSupplierAccount, updateSupplierAccount, deleteSupplierAccount,
  batchDeleteSupplierAccounts, reviewSupplierAccount, freezeSupplierAccount, unfreezeSupplierAccount, disableSupplierAccount,
  resetSupplierAccountPassword, getSupplierAccountStats,
  getSupplierSubAccounts, getSupplierSubAccountById, createSupplierSubAccount, updateSupplierSubAccount, deleteSupplierSubAccount, updateSupplierSubAccountStatus,
  getCopperPrices, getCopperPriceById, getCurrentCopperPrice, createCopperPrice, updateCopperPrice, deleteCopperPrice, setCurrentCopperPrice,
  getCopperPriceRangesByMaterialId, getCopperPriceRangeById, createCopperPriceRange, updateCopperPriceRange, deleteCopperPriceRange, batchDeleteCopperPriceRanges, getPriceByCopperPrice
}
export function getCopperPriceRangesByMaterialId(materialId) {
  const rows = query(`
    SELECT * FROM copper_price_ranges 
    WHERE material_id = ? 
    ORDER BY min_copper_price ASC
  `, [materialId])
  return rows.map(row => convertToCamelCase(row))
}

export function getCopperPriceRangeById(id) {
  const row = query('SELECT * FROM copper_price_ranges WHERE id = ?', [id])[0]
  return row ? convertToCamelCase(row) : null
}

export function createCopperPriceRange(data) {
  const result = query(`
    INSERT INTO copper_price_ranges (material_id, min_copper_price, max_copper_price, unit_price, remark)
    VALUES (?, ?, ?, ?, ?)
  `, [data.materialId, data.minCopperPrice, data.maxCopperPrice, data.unitPrice, data.remark || ''])
  return { id: result.lastInsertRowid, ...data }
}

export function updateCopperPriceRange(id, data) {
  query(`
    UPDATE copper_price_ranges 
    SET min_copper_price = ?, max_copper_price = ?, unit_price = ?, remark = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [data.minCopperPrice, data.maxCopperPrice, data.unitPrice, data.remark || '', id])
  return getCopperPriceRangeById(id)
}

export function deleteCopperPriceRange(id) {
  query('DELETE FROM copper_price_ranges WHERE id = ?', [id])
  return true
}

export function batchDeleteCopperPriceRanges(materialId) {
  query('DELETE FROM copper_price_ranges WHERE material_id = ?', [materialId])
  return true
}

export function getPriceByCopperPrice(materialId, copperPrice) {
  const row = query(`
    SELECT unit_price FROM copper_price_ranges 
    WHERE material_id = ? AND min_copper_price <= ? AND max_copper_price >= ?
    ORDER BY min_copper_price DESC
    LIMIT 1
  `, [materialId, copperPrice, copperPrice])[0]
  return row ? row.unit_price : null
}
