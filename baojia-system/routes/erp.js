const express = require('express');
const router = express.Router();
const db = require('../models/database');

/**
 * ERP系统接入接口
 * 
 * 接口规范：
 * - 认证方式：Bearer Token（在请求头中）
 * - 数据格式：JSON
 * - 编码格式：UTF-8
 * - 时间格式：ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
 * 
 * 错误响应格式：
 * {
 *   "success": false,
 *   "error": "错误描述",
 *   "code": 错误码
 * }
 * 
 * 成功响应格式：
 * {
 *   "success": true,
 *   "data": {...},
 *   "total": 总数（仅列表接口）
 * }
 */

// 接口健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

/**
 * 产品数据接口
 */

// 获取产品列表
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const products = db.getAllProducts();
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    res.json({
      success: true,
      data: products.slice(start, end),
      total: products.length,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 获取单个产品
router.get('/products/:id', async (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: '产品不存在', code: 404 });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 批量导入产品
router.post('/products/batch', async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, error: '数据格式错误，应为数组', code: 400 });
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const product of products) {
      try {
        if (product.id && db.getProductById(product.id)) {
          db.updateProduct(product.id, product);
        } else {
          db.createProduct(product);
        }
        successCount++;
      } catch {
        failedCount++;
      }
    }
    
    res.json({
      success: true,
      data: {
        total: products.length,
        success: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 客户数据接口
 */

// 获取客户列表
router.get('/customers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const customers = db.getAllCustomers();
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    res.json({
      success: true,
      data: customers.slice(start, end),
      total: customers.length,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 获取单个客户
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: '客户不存在', code: 404 });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 批量导入客户
router.post('/customers/batch', async (req, res) => {
  try {
    const customers = req.body;
    if (!Array.isArray(customers)) {
      return res.status(400).json({ success: false, error: '数据格式错误，应为数组', code: 400 });
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const customer of customers) {
      try {
        if (customer.id && db.getCustomerById(customer.id)) {
          db.updateCustomer(customer.id, customer);
        } else {
          db.createCustomer(customer);
        }
        successCount++;
      } catch {
        failedCount++;
      }
    }
    
    res.json({
      success: true,
      data: {
        total: customers.length,
        success: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 报价单数据接口
 */

// 获取报价单列表
router.get('/quotes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const quotes = db.getAllQuotes();
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    res.json({
      success: true,
      data: quotes.slice(start, end),
      total: quotes.length,
      page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 获取单个报价单
router.get('/quotes/:id', async (req, res) => {
  try {
    const quote = db.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: '报价单不存在', code: 404 });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

// 创建报价单
router.post('/quotes', async (req, res) => {
  try {
    const quote = db.createQuote(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 电线规格接口
 */

router.get('/wire-specs', async (req, res) => {
  try {
    const wireSpecs = db.getAllWireSpecs();
    res.json({ success: true, data: wireSpecs, total: wireSpecs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 插头价格接口
 */

router.get('/plugs', async (req, res) => {
  try {
    const plugs = db.getAllPlugs();
    res.json({ success: true, data: plugs, total: plugs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 尾部处理接口
 */

router.get('/tail-processings', async (req, res) => {
  try {
    const tailProcessings = db.getAllTailProcessings();
    res.json({ success: true, data: tailProcessings, total: tailProcessings.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 料号接口
 */

router.get('/process-cards', async (req, res) => {
  try {
    const processCards = db.getAllProcessCards();
    res.json({ success: true, data: processCards, total: processCards.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 报价人接口
 */

router.get('/salespersons', async (req, res) => {
  try {
    const salespersons = db.getAllSalespersons();
    res.json({ success: true, data: salespersons, total: salespersons.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 系统设置接口
 */

router.get('/settings', async (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

/**
 * 数据导出接口
 */

router.get('/export/all', async (req, res) => {
  try {
    const data = {
      products: db.getAllProducts(),
      customers: db.getAllCustomers(),
      quotes: db.getAllQuotes(),
      wireSpecs: db.getAllWireSpecs(),
      plugs: db.getAllPlugs(),
      tailProcessings: db.getAllTailProcessings(),
      processCards: db.getAllProcessCards(),
      salespersons: db.getAllSalespersons(),
      settings: db.getSettings(),
      exportTime: new Date().toISOString()
    };
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 500 });
  }
});

module.exports = router;