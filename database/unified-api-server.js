import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { initDatabase, isDbAvailable } from './config.js'
import * as api from './api.js'
import pdf from 'html-pdf-node'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 限制 10MB
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Unified API Server is running',
    database: isDbAvailable() ? 'SQLite connected' : 'SQLite unavailable',
    timestamp: new Date().toISOString()
  })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = api.getUserByUsername(username)
    
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' })
    }
    
    if (user.password !== password) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' })
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({ success: false, error: '用户已禁用' })
    }
    
    const token = `${user.id}-${Date.now()}`
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.roleId || 'user'
      }
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未登录' })
    }
    
    const token = authHeader.substring(7)
    const userId = token.split('-')[0]
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(401).json({ success: false, error: '无效的token' })
    }
    
    const user = api.getUserById(parseInt(userId))
    
    if (!user) {
      return res.status(401).json({ success: false, error: '用户不存在' })
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.roleId || 'user'
      }
    })
  } catch (error) {
    console.error('Error during validate:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/auth/logout', async (req, res) => {
  try {
    res.json({ success: true, message: '退出成功' })
  } catch (error) {
    console.error('Error during logout:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/auth/users', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getUsers(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/auth/users', async (req, res) => {
  try {
    const user = api.createUser(req.body)
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const user = api.updateUser(parseInt(req.params.id), req.body)
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    api.deleteUser(parseInt(req.params.id))
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/auth/users/:id/password', async (req, res) => {
  try {
    api.updateUserPassword(parseInt(req.params.id), req.body.newPassword)
    res.json({ success: true, message: '密码重置成功' })
  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/products', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getProducts(params)
    res.json({ success: true, products: result.data, total: result.total })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = api.getProductById(parseInt(req.params.id))
    if (product) {
      res.json({ success: true, data: product })
    } else {
      res.status(404).json({ success: false, error: 'Product not found' })
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/products/item/:code', async (req, res) => {
  try {
    const product = api.getProductByCode(req.params.code)
    if (product) {
      res.json({ success: true, data: product })
    } else {
      res.status(404).json({ success: false, error: 'Product not found' })
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products', async (req, res) => {
  try {
    const product = api.createProduct(req.body)
    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = api.updateProduct(parseInt(req.params.id), req.body)
    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    api.deleteProduct(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/products/batch/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id))
    api.batchDeleteProducts(ids)
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/products/search', async (req, res) => {
  try {
    const keyword = req.query.q || ''
    const result = api.getProducts({ search: keyword })
    res.json({ success: true, products: result.data, total: result.total })
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products/parse', async (req, res) => {
  try {
    const { description } = req.body
    const result = api.parseProductWithPrice(description)
    
    res.json({
      success: true,
      parsedData: result.parsedData,
      calculation: result.calculation
    })
  } catch (error) {
    console.error('Error parsing product description:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products/calculate-price', async (req, res) => {
  try {
    const price = api.calculateProductPrice(req.body)
    res.json({ success: true, price })
  } catch (error) {
    console.error('Error calculating product price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products/:id/calculate', async (req, res) => {
  try {
    const result = api.calculateProductById(parseInt(req.params.id))
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error calculating product:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products/calculate-all', async (req, res) => {
  try {
    const count = api.calculateAllProducts()
    res.json({ success: true, count })
  } catch (error) {
    console.error('Error calculating all products:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/products/generate-code', async (req, res) => {
  try {
    const materialType = req.body.materialType || ''
    const code = api.generateProductCode(materialType)
    res.json({ success: true, code })
  } catch (error) {
    console.error('Error generating product code:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/materials', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status,
      materialType: req.query.materialType
    }
    const result = api.getMaterials(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching materials:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/materials/:code', async (req, res) => {
  try {
    const material = api.getMaterialByCode(req.params.code)
    if (material) {
      res.json({ success: true, data: material })
    } else {
      res.status(404).json({ success: false, error: 'Material not found' })
    }
  } catch (error) {
    console.error('Error fetching material:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/materials', async (req, res) => {
  try {
    const material = api.createMaterial(req.body)
    res.json({ success: true, data: material })
  } catch (error) {
    console.error('Error creating material:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/materials/:id', async (req, res) => {
  try {
    const material = api.updateMaterial(parseInt(req.params.id), req.body)
    res.json({ success: true, data: material })
  } catch (error) {
    console.error('Error updating material:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/materials/:id', async (req, res) => {
  try {
    api.deleteMaterial(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/customers', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getCustomers(params)
    res.json({ success: true, data: result.data, total: result.total })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = api.getCustomerById(parseInt(req.params.id))
    if (customer) {
      res.json({ success: true, data: customer })
    } else {
      res.status(404).json({ success: false, error: 'Customer not found' })
    }
  } catch (error) {
    console.error('Error fetching customer:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/customers', async (req, res) => {
  try {
    const customer = api.createCustomer(req.body)
    res.json({ success: true, data: customer })
  } catch (error) {
    console.error('Error creating customer:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = api.updateCustomer(parseInt(req.params.id), req.body)
    res.json({ success: true, data: customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/customers/:id', async (req, res) => {
  try {
    api.deleteCustomer(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/suppliers', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getSuppliers(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = api.getSupplierById(parseInt(req.params.id))
    if (supplier) {
      res.json({ success: true, data: supplier })
    } else {
      res.status(404).json({ success: false, error: 'Supplier not found' })
    }
  } catch (error) {
    console.error('Error fetching supplier:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = api.createSupplier(req.body)
    res.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error creating supplier:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = api.updateSupplier(parseInt(req.params.id), req.body)
    res.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    api.deleteSupplier(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-accounts', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getSupplierAccounts(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching supplier accounts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-accounts/:id', async (req, res) => {
  try {
    const account = api.getSupplierAccountById(parseInt(req.params.id))
    if (account) {
      res.json({ success: true, data: account })
    } else {
      res.status(404).json({ success: false, error: 'Supplier account not found' })
    }
  } catch (error) {
    console.error('Error fetching supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-accounts', async (req, res) => {
  try {
    const accountData = req.body
    const existingAccount = api.getSupplierAccountByEmail(accountData.loginEmail)
    if (existingAccount) {
      return res.status(400).json({ success: false, error: '该邮箱已被注册' })
    }
    
    const supplierCode = accountData.supplierCode || generateSupplierCode()
    const initialPassword = generatePassword()
    
    const account = api.createSupplierAccount({
      ...accountData,
      supplier_code: supplierCode,
      login_email: accountData.loginEmail,
      password: initialPassword,
      company_name: accountData.companyName,
      unified_social_credit_code: accountData.unifiedSocialCreditCode,
      tax_type: accountData.taxType,
      contact_person: accountData.contactPerson,
      contact_phone: accountData.contactPhone,
      address: accountData.address,
      bank_name: accountData.bankName,
      bank_account: accountData.bankAccount,
      remark: accountData.remark,
      status: 'pending_activation',
      review_status: 'pending'
    })
    
    res.json({ 
      success: true, 
      data: { 
        ...account, 
        supplierCode: supplierCode, 
        initialPassword 
      } 
    })
  } catch (error) {
    console.error('Error creating supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-accounts/:id', async (req, res) => {
  try {
    const accountData = req.body
    const existing = api.getSupplierAccountById(parseInt(req.params.id))
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Supplier account not found' })
    }
    
    if (existing.login_email !== accountData.loginEmail) {
      const duplicate = api.getSupplierAccountByEmail(accountData.loginEmail)
      if (duplicate) {
        return res.status(400).json({ success: false, error: '该邮箱已被注册' })
      }
    }
    
    const account = api.updateSupplierAccount(parseInt(req.params.id), {
      supplier_code: accountData.supplierCode,
      login_email: accountData.loginEmail,
      company_name: accountData.companyName,
      unified_social_credit_code: accountData.unifiedSocialCreditCode,
      tax_type: accountData.taxType,
      contact_person: accountData.contactPerson,
      contact_phone: accountData.contactPhone,
      address: accountData.address,
      bank_name: accountData.bankName,
      bank_account: accountData.bankAccount,
      remark: accountData.remark
    })
    
    res.json({ success: true, data: account })
  } catch (error) {
    console.error('Error updating supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/supplier-accounts/:id', async (req, res) => {
  try {
    api.deleteSupplierAccount(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/supplier-accounts/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'Invalid IDs' })
    }
    api.batchDeleteSupplierAccounts(ids)
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting supplier accounts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-accounts/:id/review', async (req, res) => {
  try {
    const { result, remark } = req.body
    if (!result || !['approved', 'rejected'].includes(result)) {
      return res.status(400).json({ success: false, error: 'Invalid review result' })
    }
    const account = api.reviewSupplierAccount(parseInt(req.params.id), result, remark)
    res.json({ success: true, data: account })
  } catch (error) {
    console.error('Error reviewing supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-accounts/:id/freeze', async (req, res) => {
  try {
    const account = api.freezeSupplierAccount(parseInt(req.params.id))
    res.json({ success: true, data: account })
  } catch (error) {
    console.error('Error freezing supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-accounts/:id/unfreeze', async (req, res) => {
  try {
    const account = api.unfreezeSupplierAccount(parseInt(req.params.id))
    res.json({ success: true, data: account })
  } catch (error) {
    console.error('Error unfreezing supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-accounts/:id/disable', async (req, res) => {
  try {
    const { reason } = req.body
    const account = api.disableSupplierAccount(parseInt(req.params.id), reason)
    res.json({ success: true, data: account })
  } catch (error) {
    console.error('Error disabling supplier account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-accounts/:id/reset-password', async (req, res) => {
  try {
    const newPassword = generatePassword()
    const result = api.resetSupplierAccountPassword(parseInt(req.params.id), newPassword)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error resetting supplier account password:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-accounts/stats/summary', async (req, res) => {
  try {
    const stats = api.getSupplierAccountStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching supplier account stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-sub-accounts', async (req, res) => {
  try {
    const supplierId = parseInt(req.query.supplierId)
    if (!supplierId) {
      return res.status(400).json({ success: false, error: 'Supplier ID is required' })
    }
    const result = api.getSupplierSubAccounts(supplierId)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching supplier sub accounts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-sub-accounts', async (req, res) => {
  try {
    const subAccountData = req.body
    const existing = api.getSupplierSubAccountById(subAccountData.id)
    
    if (existing) {
      const subAccount = api.updateSupplierSubAccount(subAccountData.id, {
        login_email: subAccountData.loginEmail,
        contact_person: subAccountData.contactPerson,
        contact_phone: subAccountData.contactPhone,
        role: subAccountData.role,
        status: subAccountData.status || 'active'
      })
      res.json({ success: true, data: subAccount })
    } else {
      const initialPassword = generatePassword()
      const subAccount = api.createSupplierSubAccount({
        supplier_account_id: subAccountData.supplierId,
        login_email: subAccountData.loginEmail,
        password: initialPassword,
        contact_person: subAccountData.contactPerson,
        contact_phone: subAccountData.contactPhone,
        role: subAccountData.role,
        status: 'active'
      })
      res.json({ success: true, data: { ...subAccount, initialPassword } })
    }
  } catch (error) {
    console.error('Error creating/updating supplier sub account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/supplier-sub-accounts/:id', async (req, res) => {
  try {
    api.deleteSupplierSubAccount(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier sub account:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

function generateSupplierCode() {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `SUP${timestamp.slice(-6)}`
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

app.get('/api/inventory', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getInventory(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/inventory/records', async (req, res) => {
  try {
    const record = api.createInventoryRecord(req.body)
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('Error creating inventory record:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/quotes', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status,
      customerId: req.query.customerId ? parseInt(req.query.customerId) : undefined
    }
    const result = api.getQuotes(params)
    res.json({ success: true, quotes: result.data, total: result.total })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/quotes/:id', async (req, res) => {
  try {
    const quote = api.getQuoteById(parseInt(req.params.id))
    if (quote) {
      res.json({ success: true, data: quote })
    } else {
      res.status(404).json({ success: false, error: 'Quote not found' })
    }
  } catch (error) {
    console.error('Error fetching quote:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    api.deleteQuote(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/quotes', async (req, res) => {
  try {
    const quote = api.createQuote(req.body)
    res.json({ success: true, data: quote })
  } catch (error) {
    console.error('Error creating quote:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/quotes/:id', async (req, res) => {
  try {
    const quote = api.updateQuote(parseInt(req.params.id), req.body)
    res.json({ success: true, data: quote })
  } catch (error) {
    console.error('Error updating quote:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/quotes/batch/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id))
    ids.forEach(id => api.deleteQuote(id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting quotes:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/quotes/:id/copy', async (req, res) => {
  try {
    const quote = api.copyQuote(parseInt(req.params.id))
    res.json({ success: true, data: quote })
  } catch (error) {
    console.error('Error copying quote:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/quotes/next-number', async (req, res) => {
  try {
    const nextNumber = api.getNextQuoteNumber()
    res.json({ success: true, data: { quoteNumber: nextNumber } })
  } catch (error) {
    console.error('Error getting next quote number:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/quotes/:id/items', async (req, res) => {
  try {
    const items = api.getQuoteItems(parseInt(req.params.id))
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Error fetching quote items:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/quotes/:id/items', async (req, res) => {
  try {
    api.updateQuoteItems(parseInt(req.params.id), req.body.items)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating quote items:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/quotes/:id/export/pdf', async (req, res) => {
  try {
    const quote = api.getQuoteById(parseInt(req.params.id))
    if (!quote) {
      return res.status(404).json({ success: false, error: '报价单不存在' })
    }

    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        sent: '已发送',
        confirmed: '已确认',
        rejected: '已拒绝',
        expired: '已过期'
      }
      return statusMap[status] || status
    }

    const getCurrencyText = (currency) => {
      const currencyMap = {
        CNY: '人民币',
        USD: '美元',
        EUR: '欧元'
      }
      return currencyMap[currency] || currency
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const customer = quote.customer && typeof quote.customer === 'object' ? quote.customer : { name: quote.customer }
    const salesperson = quote.salesperson && typeof quote.salesperson === 'object' ? quote.salesperson : { name: quote.salesperson }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>报价单 ${quote.quoteNumber}</title>
  <style>
    body { font-family: 'SimHei', 'Microsoft YaHei', sans-serif; margin: 0; padding: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; color: #1f2937; }
    .quote-number { margin-top: 10px; font-size: 16px; color: #6b7280; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .info-item { flex: 1; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #1f2937; }
    .table-container { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .total-row { margin-top: 20px; text-align: right; }
    .total-label { font-size: 18px; font-weight: bold; color: #374151; }
    .total-value { font-size: 24px; font-weight: bold; color: #dc2626; }
    .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; }
    .detail-value { margin-top: 5px; }
    .text-gray { color: #6b7280; }
    .text-primary { color: #dc2626; }
    .text-sm { font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">报价单</div>
    <div class="quote-number">报价单号：${quote.quoteNumber}</div>
    <div class="text-gray text-sm">创建时间：${formatDateTime(quote.createdAt)}</div>
  </div>

  <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
    <div class="info-row">
      <div class="info-item">
        <div class="label">客户</div>
        <div class="value detail-value">${customer.name || '-'}</div>
        ${customer.code ? `<div class="text-sm text-gray">客户编号: ${customer.code}</div>` : ''}
        ${customer.contactPerson || customer.phone ? `<div class="text-sm text-gray">${customer.contactPerson || ''} ${customer.phone || ''}</div>` : ''}
        ${customer.address ? `<div class="text-sm text-gray">${customer.address}</div>` : ''}
      </div>
      <div class="info-item">
        <div class="label">报价人</div>
        <div class="value detail-value">${salesperson.name || '-'}</div>
        ${salesperson.username ? `<div class="text-sm text-gray">${salesperson.username}</div>` : ''}
      </div>
    </div>

    <div class="info-row">
      <div class="info-item">
        <div class="label">报价日期</div>
        <div class="value detail-value">${formatDate(quote.quoteDate)}</div>
      </div>
      <div class="info-item">
        <div class="label">有效日期</div>
        <div class="value detail-value">${formatDate(quote.validUntil) || '未设置'}</div>
      </div>
    </div>

    <div class="info-row">
      <div class="info-item">
        <div class="label">货币</div>
        <div class="value detail-value">${getCurrencyText(quote.currency)}</div>
      </div>
      <div class="info-item">
        <div class="label">状态</div>
        <div class="value detail-value">${getStatusText(quote.status)}</div>
      </div>
    </div>

    ${quote.paymentMethod ? `
    <div class="info-row">
      <div class="info-item">
        <div class="label">付款方式</div>
        <div class="value detail-value">${quote.paymentMethod}</div>
      </div>
      <div class="info-item">
        <div class="label">报价有效期铜价</div>
        <div class="value detail-value">${quote.validityTerm || '-'}</div>
      </div>
    </div>
    ` : ''}

    ${quote.deliveryTerm ? `
    <div class="info-row">
      <div class="info-item" style="flex: 2;">
        <div class="label">货物交付地址</div>
        <div class="value detail-value">${quote.deliveryTerm}</div>
      </div>
    </div>
    ` : ''}

    ${quote.remarks ? `
    <div class="info-row">
      <div class="info-item" style="flex: 2;">
        <div class="label">备注</div>
        <div class="value detail-value">${quote.remarks}</div>
      </div>
    </div>
    ` : ''}
  </div>

  <div class="table-container">
    <h3 style="color: #374151; margin-bottom: 15px;">报价明细</h3>
    <table>
      <thead>
        <tr>
          <th>序号</th>
          <th>物料编号</th>
          <th>产品描述</th>
          <th style="text-align: right;">数量</th>
          <th style="text-align: center;">单位</th>
          <th style="text-align: right;">单价</th>
          <th style="text-align: right;">金额</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items?.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.materialCode || '-'}</td>
          <td>${item.description || item.productName || '-'}</td>
          <td style="text-align: right;">${item.quantity || 0}</td>
          <td style="text-align: center;">${item.unit || '-'}</td>
          <td style="text-align: right;">¥${(item.unitPrice || 0).toFixed(4)}</td>
          <td style="text-align: right;">¥${(item.amount || item.totalPrice || 0).toFixed(2)}</td>
        </tr>
        `).join('') || '<tr><td colspan="7" style="text-align: center;">暂无明细</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="total-row">
    <div style="margin-bottom: 10px;">
      <span class="text-gray">明细数量：</span>
      <span>${quote.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</span>
      <span style="margin-left: 30px;" class="text-gray">明细项数：</span>
      <span>${quote.items?.length || 0} 项</span>
    </div>
    ${quote.subtotal !== undefined && quote.subtotal > 0 ? `
    <div style="margin-bottom: 5px;">
      <span class="text-gray">小计：</span>
      <span>¥${quote.subtotal.toFixed(2)}</span>
    </div>
    ` : ''}
    ${quote.taxRate !== undefined && quote.taxRate > 0 ? `
    <div style="margin-bottom: 5px;">
      <span class="text-gray">税额(${quote.taxRate}%)：</span>
      <span>¥${(quote.taxAmount || 0).toFixed(2)}</span>
    </div>
    ` : ''}
    <div>
      <span class="total-label">合计金额：</span>
      <span class="total-value">¥${(quote.totalAmount || 0).toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>--- 报价单结束 ---</p>
  </div>
</body>
</html>`

    const options = {
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    }

    const file = { content: htmlContent }
    const pdfBuffer = await pdf.generatePdf(file, options)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="报价单_${quote.quoteNumber}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ success: false, error: '导出PDF失败: ' + error.message })
  }
})

app.get('/api/wire-specs', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getWireSpecs(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching wire specs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/wire-specs/:spec', async (req, res) => {
  try {
    api.deleteWireSpec(req.params.spec)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting wire spec:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/wire-specs/:spec', async (req, res) => {
  try {
    const wireSpec = api.getWireSpecBySpec(req.params.spec)
    if (wireSpec) {
      res.json({ success: true, data: wireSpec })
    } else {
      res.status(404).json({ success: false, error: 'Wire spec not found' })
    }
  } catch (error) {
    console.error('Error fetching wire spec:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/wire-specs', async (req, res) => {
  try {
    const id = api.createWireSpec(req.body)
    const wireSpec = api.getWireSpecBySpec(req.body.spec)
    res.json({ success: true, data: wireSpec })
  } catch (error) {
    console.error('Error creating wire spec:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/wire-specs/:spec', async (req, res) => {
  try {
    const wireSpec = api.updateWireSpec(req.params.spec, req.body)
    if (wireSpec) {
      res.json({ success: true, data: wireSpec })
    } else {
      res.status(404).json({ success: false, error: 'Wire spec not found' })
    }
  } catch (error) {
    console.error('Error updating wire spec:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/wire-specs/batch-update', async (req, res) => {
  try {
    // 支持两种格式：{ specs: [...] } 或 [...]
    let specs = req.body.specs || req.body
    if (!Array.isArray(specs)) {
      specs = [specs]
    }
    
    const updatedSpecs = []
    for (const spec of specs) {
      const updated = api.updateWireSpec(spec.spec, spec)
      if (updated) updatedSpecs.push(updated)
    }
    res.json({ success: true, updated: updatedSpecs.length, data: updatedSpecs })
  } catch (error) {
    console.error('Error batch updating wire specs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/wire-specs/batch/:specs', async (req, res) => {
  try {
    const specs = req.params.specs.split(',').map(s => decodeURIComponent(s))
    for (const spec of specs) {
      api.deleteWireSpec(spec)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting wire specs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/wire-specs/calculate', async (req, res) => {
  try {
    const { spec, wireType, materialType } = req.body
    const copperPrice = api.getCurrentCopperPrice()
    const currentPrice = copperPrice?.price || 68000
    const processFee = copperPrice?.process_fee || 4000
    
    const copperDensity = 8.96
    const materialDensity = 1.4
    
    let copperWeight = 0
    let materialWeight = 0
    let fillerWeight = 0
    
    if (spec && wireType && materialType) {
      const specMatch = spec.match(/(\d+)\/?(\d+)?C?\s*[*×x]\s*([\d.]+)/) || spec.match(/([\d.]+)/)
      if (specMatch) {
        const coreCount = parseInt(specMatch[1]) || 1
        const section = parseFloat(specMatch[3] || specMatch[1]) || 0.75
        copperWeight = coreCount * section * copperDensity * 10
        materialWeight = copperWeight * 1.5
      }
    }
    
    const copperCost = (currentPrice + processFee) * copperWeight / 1000000
    const materialCost = (materialType === 'PVC' ? 15000 : 18000) * materialWeight / 1000000
    const fillerCost = 23000 * fillerWeight / 1000000
    const basePrice = copperCost + materialCost + fillerCost
    const finalPrice = basePrice / 0.85
    
    res.json({
      success: true,
      data: {
        spec,
        wireType,
        materialType,
        copperWeight: copperWeight.toFixed(2),
        materialWeight: materialWeight.toFixed(2),
        fillerWeight: fillerWeight.toFixed(2),
        copperCost: copperCost.toFixed(4),
        materialCost: materialCost.toFixed(4),
        fillerCost: fillerCost.toFixed(4),
        basePrice: basePrice.toFixed(4),
        finalPrice: finalPrice.toFixed(4),
        copperPrice: currentPrice,
        copperProcessFee: processFee
      }
    })
  } catch (error) {
    console.error('Error calculating wire spec:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/wire-specs/calculate-all', async (req, res) => {
  try {
    const copperPrice = api.getCurrentCopperPrice()
    const currentPrice = copperPrice?.price || 68000
    const processFee = copperPrice?.process_fee || 4000
    
    const specs = api.getWireSpecs({}).data
    const updatedSpecs = []
    
    for (const spec of specs) {
      const copperCost = (currentPrice + processFee) * (spec.copper_weight || 0) / 1000000
      const materialCost = 15000 * (spec.material_weight || 0) / 1000000
      const fillerCost = 23000 * (spec.filler_weight || 0) / 1000000
      const basePrice = copperCost + materialCost + fillerCost
      const finalPrice = basePrice / 0.85
      
      const updated = api.updateWireSpec(spec.spec, {
        ...spec,
        copperCost,
        materialCost,
        fillerCost,
        basePrice,
        finalPrice,
        copperPricePerTon: currentPrice,
        copperProcessFee: processFee
      })
      updatedSpecs.push(updated)
    }
    
    res.json({
      success: true,
      data: updatedSpecs,
      message: `Successfully calculated ${updatedSpecs.length} wire specs`
    })
  } catch (error) {
    console.error('Error calculating all wire specs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/wire-specs/copper-price-info', async (req, res) => {
  try {
    const copperPrice = api.getCurrentCopperPrice()
    res.json({
      success: true,
      data: {
        copperPrice: copperPrice?.price || 68000,
        copperProcessFee: copperPrice?.process_fee || 4000,
        syncedAt: copperPrice?.updated_at || null,
        source: 'ERP'
      }
    })
  } catch (error) {
    console.error('Error fetching copper price info:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/wire-specs/sync-copper-price', async (req, res) => {
  try {
    const copperPrice = api.getCurrentCopperPrice()
    res.json({
      success: true,
      copperPrice: copperPrice?.price || 68000,
      copperProcessFee: copperPrice?.process_fee || 4000,
      syncedAt: copperPrice?.updated_at || new Date().toISOString(),
      source: 'ERP'
    })
  } catch (error) {
    console.error('Error syncing copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/plugs', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getPlugs(params)
    res.json({ success: true, plugs: result.data, total: result.total })
  } catch (error) {
    console.error('Error fetching plugs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/plugs/:id', async (req, res) => {
  try {
    api.deletePlug(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting plug:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/plugs/:id', async (req, res) => {
  try {
    const plug = api.getPlugById(parseInt(req.params.id))
    if (plug) {
      res.json({ success: true, data: plug })
    } else {
      res.status(404).json({ success: false, error: 'Plug not found' })
    }
  } catch (error) {
    console.error('Error fetching plug:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/plugs/all', async (req, res) => {
  try {
    const result = api.getPlugs({})
    res.json({ success: true, plugs: result.data })
  } catch (error) {
    console.error('Error fetching all plugs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/plugs', async (req, res) => {
  try {
    const id = api.createPlug(req.body)
    const plug = api.getPlugById(id)
    res.json({ success: true, data: plug })
  } catch (error) {
    console.error('Error creating plug:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/plugs/:id', async (req, res) => {
  try {
    const plug = api.updatePlug(parseInt(req.params.id), req.body)
    if (plug) {
      res.json({ success: true, data: plug })
    } else {
      res.status(404).json({ success: false, error: 'Plug not found' })
    }
  } catch (error) {
    console.error('Error updating plug:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/plugs/batch/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id))
    for (const id of ids) {
      api.deletePlug(id)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting plugs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/tail-processings', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getTailProcessings(params)
    res.json({ success: true, tailProcessings: result.data, total: result.total })
  } catch (error) {
    console.error('Error fetching tail processings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/tail-processings/:id', async (req, res) => {
  try {
    api.deleteTailProcessing(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting tail processing:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/tail-processings/:id', async (req, res) => {
  try {
    const tailProcessing = api.getTailProcessingById(parseInt(req.params.id))
    if (tailProcessing) {
      res.json({ success: true, data: tailProcessing })
    } else {
      res.status(404).json({ success: false, error: 'Tail processing not found' })
    }
  } catch (error) {
    console.error('Error fetching tail processing:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/tail-processings', async (req, res) => {
  try {
    const id = api.createTailProcessing(req.body)
    const tailProcessing = api.getTailProcessingById(id)
    res.json({ success: true, data: tailProcessing })
  } catch (error) {
    console.error('Error creating tail processing:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/tail-processings/:id', async (req, res) => {
  try {
    const tailProcessing = api.updateTailProcessing(parseInt(req.params.id), req.body)
    if (tailProcessing) {
      res.json({ success: true, data: tailProcessing })
    } else {
      res.status(404).json({ success: false, error: 'Tail processing not found' })
    }
  } catch (error) {
    console.error('Error updating tail processing:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/tail-processings/batch/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id))
    for (const id of ids) {
      api.deleteTailProcessing(id)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting tail processings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============ 导入 API ============

// 电线规格导入
app.post('/api/wire-specs/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
    }
    const dataList = api.parseExcelFile(req.file.buffer)
    if (dataList.length === 0) {
      return res.status(400).json({ success: false, error: '文件内容为空' })
    }
    const result = api.importWireSpecs(dataList)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error importing wire specs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 插头价格导入
app.post('/api/plugs/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
    }
    const dataList = api.parseExcelFile(req.file.buffer)
    if (dataList.length === 0) {
      return res.status(400).json({ success: false, error: '文件内容为空' })
    }
    const result = api.importPlugs(dataList)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error importing plugs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 尾部处理价格导入
app.post('/api/tail-processings/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' })
    }
    const dataList = api.parseExcelFile(req.file.buffer)
    if (dataList.length === 0) {
      return res.status(400).json({ success: false, error: '文件内容为空' })
    }
    const result = api.importTailProcessings(dataList)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error importing tail processings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/settings', async (req, res) => {
  try {
    const params = {}
    if (req.query.category) params.category = req.query.category
    const result = api.getSettings(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/settings/:key', async (req, res) => {
  try {
    const setting = api.getSetting(req.params.key)
    if (setting) {
      res.json({ success: true, data: setting })
    } else {
      res.status(404).json({ success: false, error: 'Setting not found' })
    }
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value, category } = req.body
    const setting = api.upsertSetting(key, value, category)
    res.json({ success: true, data: setting })
  } catch (error) {
    console.error('Error upserting setting:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getUsers(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/roles', async (req, res) => {
  try {
    const roles = api.getRoles()
    res.json({ success: true, data: roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/roles/roles', async (req, res) => {
  try {
    const roles = api.getRoles()
    res.json({ success: true, roles: roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/roles/roles', async (req, res) => {
  try {
    const role = await api.createRole(req.body)
    res.json({ success: true, role })
  } catch (error) {
    console.error('Error creating role:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/roles/roles/:id', async (req, res) => {
  try {
    const role = await api.updateRole(req.params.id, req.body)
    res.json({ success: true, role })
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/roles/roles/:id', async (req, res) => {
  try {
    await api.deleteRole(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/roles/permissions', async (req, res) => {
  try {
    const permissions = api.getPermissions()
    res.json({ success: true, permissions })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/salespersons', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      status: req.query.status
    }
    const result = api.getSalespersons(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching salespersons:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/salespersons', async (req, res) => {
  try {
    const salesperson = api.createSalesperson(req.body)
    res.json({ success: true, data: salesperson })
  } catch (error) {
    console.error('Error creating salesperson:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/salespersons/:id', async (req, res) => {
  try {
    const salesperson = api.updateSalesperson(parseInt(req.params.id), req.body)
    res.json({ success: true, data: salesperson })
  } catch (error) {
    console.error('Error updating salesperson:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/salespersons/:id', async (req, res) => {
  try {
    api.deleteSalesperson(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting salesperson:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/salespersons/batch/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',').map(id => parseInt(id))
    api.batchDeleteSalespersons(ids)
    res.json({ success: true })
  } catch (error) {
    console.error('Error batch deleting salespersons:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '邮箱和密码不能为空' })
    }
    
    const account = api.getSupplierAccountByEmail(email)
    if (!account) {
      return res.status(401).json({ success: false, error: '邮箱或密码错误' })
    }
    
    if (account.password !== password) {
      return res.status(401).json({ success: false, error: '邮箱或密码错误' })
    }
    
    if (account.status !== 'active') {
      return res.status(401).json({ success: false, error: '账户已被禁用或冻结' })
    }
    
    res.json({
      success: true,
      data: {
        id: account.id,
        supplierCode: account.supplier_code,
        companyName: account.company_name,
        email: account.login_email,
        contactPerson: account.contact_person,
        status: account.status
      }
    })
  } catch (error) {
    console.error('Error supplier login:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-auth/forget-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, error: '邮箱不能为空' })
    }
    
    const account = api.getSupplierAccountByEmail(email)
    if (!account) {
      return res.status(404).json({ success: false, error: '该邮箱未注册' })
    }
    
    res.json({
      success: true,
      message: '重置密码链接已发送到您的邮箱，请查收'
    })
  } catch (error) {
    console.error('Error forget password:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/supplier-accounts/supplier-register', async (req, res) => {
  try {
    const { companyName, unifiedSocialCreditCode, contactPerson, contactPhone, loginEmail, address, taxType } = req.body
    
    if (!companyName || !loginEmail) {
      return res.status(400).json({ success: false, error: '企业名称和登录邮箱不能为空' })
    }
    
    const existingAccount = api.getSupplierAccountByEmail(loginEmail)
    if (existingAccount) {
      return res.status(400).json({ success: false, error: '该邮箱已被注册' })
    }
    
    const supplierCode = generateSupplierCode()
    const initialPassword = generatePassword()
    
    const account = api.createSupplierAccount({
      supplier_code: supplierCode,
      login_email: loginEmail,
      password: initialPassword,
      company_name: companyName,
      unified_social_credit_code: unifiedSocialCreditCode,
      tax_type: taxType || 'general',
      contact_person: contactPerson,
      contact_phone: contactPhone,
      address: address,
      status: 'pending_review',
      review_status: 'pending'
    })
    
    res.json({
      success: true,
      data: {
        id: account.id,
        supplierCode: supplierCode,
        companyName: companyName,
        email: loginEmail,
        initialPassword: initialPassword,
        message: '注册成功，请等待审核'
      }
    })
  } catch (error) {
    console.error('Error supplier register:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/contracts', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status
    }
    const result = api.getContracts(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/contracts/:id', async (req, res) => {
  try {
    const contract = api.getContractById(parseInt(req.params.id))
    if (contract) {
      res.json({ success: true, data: contract })
    } else {
      res.status(404).json({ success: false, error: 'Contract not found' })
    }
  } catch (error) {
    console.error('Error fetching contract:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/contracts', async (req, res) => {
  try {
    const contract = api.createContract(req.body)
    res.json({ success: true, data: contract })
  } catch (error) {
    console.error('Error creating contract:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/contracts/:id', async (req, res) => {
  try {
    const contract = api.updateContract(parseInt(req.params.id), req.body)
    res.json({ success: true, data: contract })
  } catch (error) {
    console.error('Error updating contract:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    api.deleteContract(parseInt(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting contract:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-performance', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20
    }
    const result = api.getSupplierPerformance(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching supplier performance:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/supplier-performance/:id', async (req, res) => {
  try {
    const performance = api.getSupplierPerformanceById(parseInt(req.params.id))
    if (performance) {
      res.json({ success: true, data: performance })
    } else {
      res.status(404).json({ success: false, error: 'Performance record not found' })
    }
  } catch (error) {
    console.error('Error fetching supplier performance:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/supplier-performance/:id', async (req, res) => {
  try {
    const performance = api.updateSupplierPerformance(parseInt(req.params.id), req.body)
    res.json({ success: true, data: performance })
  } catch (error) {
    console.error('Error updating supplier performance:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/purchase-orders', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status,
      supplier_code: req.query.supplier_code
    }
    const result = api.getPurchaseOrders(params)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/purchase-orders/:id', async (req, res) => {
  try {
    const order = api.getPurchaseOrderById(parseInt(req.params.id))
    if (order) {
      res.json({ success: true, data: order })
    } else {
      res.status(404).json({ success: false, error: 'Order not found' })
    }
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const order = api.createPurchaseOrder(req.body)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/purchase-orders/status', async (req, res) => {
  try {
    const { orderNumber, status, confirmedDate } = req.body
    const order = api.updatePurchaseOrderStatus(orderNumber, status, confirmedDate)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Error updating purchase order status:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 铜价管理 API
app.get('/api/copper-prices', async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 100
    }
    const result = api.getCopperPrices(params)
    const currentPrice = api.getCurrentCopperPrice()
    res.json({ success: true, data: result.data, total: result.total, currentPrice })
  } catch (error) {
    console.error('Error fetching copper prices:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/copper-prices/current', async (req, res) => {
  try {
    const currentPrice = api.getCurrentCopperPrice()
    if (currentPrice) {
      res.json({ success: true, data: currentPrice })
    } else {
      res.json({ success: true, data: null })
    }
  } catch (error) {
    console.error('Error fetching current copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/copper-prices/:id', async (req, res) => {
  try {
    const copperPrice = api.getCopperPriceById(parseInt(req.params.id))
    if (copperPrice) {
      res.json({ success: true, data: copperPrice })
    } else {
      res.status(404).json({ success: false, error: '铜价记录未找到' })
    }
  } catch (error) {
    console.error('Error fetching copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/copper-prices', async (req, res) => {
  try {
    const copperPrice = api.createCopperPrice(req.body)
    res.json({ success: true, data: copperPrice })
  } catch (error) {
    console.error('Error creating copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/copper-prices/:id', async (req, res) => {
  try {
    const copperPrice = api.updateCopperPrice(parseInt(req.params.id), req.body)
    res.json({ success: true, data: copperPrice })
  } catch (error) {
    console.error('Error updating copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/copper-prices/:id', async (req, res) => {
  try {
    api.deleteCopperPrice(parseInt(req.params.id))
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Error deleting copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/copper-prices/:id/set-current', async (req, res) => {
  try {
    const copperPrice = api.setCurrentCopperPrice(parseInt(req.params.id))
    res.json({ success: true, data: copperPrice })
  } catch (error) {
    console.error('Error setting current copper price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/copper-price-ranges/:materialId', async (req, res) => {
  try {
    const ranges = api.getCopperPriceRangesByMaterialId(parseInt(req.params.materialId))
    res.json({ success: true, data: ranges })
  } catch (error) {
    console.error('Error fetching copper price ranges:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/copper-price-ranges/detail/:id', async (req, res) => {
  try {
    const range = api.getCopperPriceRangeById(parseInt(req.params.id))
    if (range) {
      res.json({ success: true, data: range })
    } else {
      res.status(404).json({ success: false, error: '铜价区间未找到' })
    }
  } catch (error) {
    console.error('Error fetching copper price range:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/copper-price-ranges', async (req, res) => {
  try {
    const range = api.createCopperPriceRange(req.body)
    res.json({ success: true, data: range })
  } catch (error) {
    console.error('Error creating copper price range:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/copper-price-ranges/:id', async (req, res) => {
  try {
    const range = api.updateCopperPriceRange(parseInt(req.params.id), req.body)
    res.json({ success: true, data: range })
  } catch (error) {
    console.error('Error updating copper price range:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/copper-price-ranges/:id', async (req, res) => {
  try {
    api.deleteCopperPriceRange(parseInt(req.params.id))
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Error deleting copper price range:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/copper-price-ranges/batch/:materialId', async (req, res) => {
  try {
    api.batchDeleteCopperPriceRanges(parseInt(req.params.materialId))
    res.json({ success: true, message: '批量删除成功' })
  } catch (error) {
    console.error('Error batch deleting copper price ranges:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/copper-price-ranges/calculate-price/:materialId/:copperPrice', async (req, res) => {
  try {
    const unitPrice = api.getPriceByCopperPrice(parseInt(req.params.materialId), parseFloat(req.params.copperPrice))
    res.json({ success: true, unitPrice })
  } catch (error) {
    console.error('Error calculating price:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

async function startServer() {
  try {
    initDatabase()
    console.log('Unified API Server initialized')

    app.listen(PORT, () => {
      console.log(`Unified API Server running on http://localhost:${PORT}`)
      console.log(`Database: SQLite (unified.db)`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()