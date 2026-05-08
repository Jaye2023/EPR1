const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const customerItemNumbers = db.getAllCustomerItemNumbers();
    res.json({ success: true, customerItemNumbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customerItemNumber = db.getCustomerItemNumberById(req.params.id);
    if (!customerItemNumber) {
      return res.status(404).json({ success: false, message: '客户料号不存在' });
    }
    res.json({ success: true, customerItemNumber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const customerItemNumbers = db.getCustomerItemNumbersByCustomerId(req.params.customerId);
    res.json({ success: true, customerItemNumbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const customerItemNumbers = db.getCustomerItemNumbersByProductId(req.params.productId);
    res.json({ success: true, customerItemNumbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('POST /api/customer-item-numbers received');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('POST /api/customer-item-numbers body:', req.body);
    
    const { customerId, itemNumber, description, productId } = req.body;
    
    if (!customerId || customerId === '' || isNaN(parseInt(customerId))) {
      console.log('Validation failed: customerId is invalid');
      return res.status(400).json({ success: false, message: '请选择客户' });
    }
    
    if (!itemNumber || !itemNumber.trim()) {
      console.log('Validation failed: itemNumber is empty');
      return res.status(400).json({ success: false, message: '请输入客户料号' });
    }

    const existing = db.getAllCustomerItemNumbers().find(
      c => c.itemNumber === itemNumber.trim() && c.customerId === parseInt(customerId)
    );
    if (existing) {
      console.log('Validation failed: duplicate item number');
      return res.status(400).json({ success: false, message: '该客户已存在相同料号' });
    }

    const newCustomerItemNumber = {
      customerId: parseInt(customerId),
      itemNumber: itemNumber.trim(),
      description: description || '',
      productId: productId ? parseInt(productId) : null
    };

    console.log('Creating customer item number:', newCustomerItemNumber);
    const created = db.addCustomerItemNumber(newCustomerItemNumber);
    console.log('Created customer item number:', created);
    res.json({ success: true, customerItemNumber: created });
  } catch (error) {
    console.error('Error creating customer item number:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { customerId, itemNumber, description, productId } = req.body;
    const id = parseInt(req.params.id);
    const existingItem = db.getCustomerItemNumberById(id);
    
    if (!existingItem) {
      return res.status(404).json({ success: false, message: '客户料号不存在' });
    }

    const updatedFields = {};
    
    if (customerId !== undefined) {
      updatedFields.customerId = parseInt(customerId);
    }
    
    if (itemNumber !== undefined) {
      const trimmedItemNumber = itemNumber.trim();
      if (!trimmedItemNumber) {
        return res.status(400).json({ success: false, message: '料号不能为空' });
      }
      
      const checkCustomerId = customerId !== undefined ? parseInt(customerId) : existingItem.customerId;
      const duplicate = db.getAllCustomerItemNumbers().find(
        c => c.id !== id && c.itemNumber === trimmedItemNumber && c.customerId === checkCustomerId
      );
      if (duplicate) {
        return res.status(400).json({ success: false, message: '该客户已存在相同料号' });
      }
      
      updatedFields.itemNumber = trimmedItemNumber;
    }
    
    if (description !== undefined) {
      updatedFields.description = description;
    }
    
    if (productId !== undefined) {
      updatedFields.productId = productId ? parseInt(productId) : null;
    }

    const updated = db.updateCustomerItemNumber(id, updatedFields);
    res.json({ success: true, customerItemNumber: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingItem = db.getCustomerItemNumberById(id);
    
    if (!existingItem) {
      return res.status(404).json({ success: false, message: '客户料号不存在' });
    }

    const processCards = db.getAllProcessCards();
    const isUsed = processCards.some(p => p.customerItemNumberId === id);
    if (isUsed) {
      return res.status(400).json({ success: false, message: '该客户料号已被料号卡关联，无法删除' });
    }

    const success = db.deleteCustomerItemNumber(id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/link-product/:productId', authMiddleware, async (req, res) => {
  try {
    const linked = db.linkProductToCustomerItem(req.params.id, req.params.productId);
    if (!linked) {
      return res.status(404).json({ success: false, message: '客户料号不存在' });
    }
    res.json({ success: true, customerItemNumber: linked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/unlink-product', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingItem = db.getCustomerItemNumberById(id);
    
    if (!existingItem) {
      return res.status(404).json({ success: false, message: '客户料号不存在' });
    }

    const updated = db.updateCustomerItemNumber(id, { productId: null });
    res.json({ success: true, customerItemNumber: updated, message: '已取消产品关联' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: '缺少批量数据' });
    }

    const results = {
      created: [],
      updated: [],
      skipped: []
    };

    for (const item of items) {
      const { id, customerId, itemNumber, description, productId } = item;
      
      if (!customerId || !itemNumber) {
        results.skipped.push({ itemNumber: item.itemNumber || '未知', reason: '缺少必要参数' });
        continue;
      }

      const trimmedItemNumber = itemNumber.trim();
      const existingByNumber = db.getAllCustomerItemNumbers().find(
        c => c.itemNumber === trimmedItemNumber && c.customerId === parseInt(customerId)
      );

      if (id) {
        const existing = db.getCustomerItemNumberById(id);
        if (existing) {
          if (existingByNumber && existingByNumber.id !== parseInt(id)) {
            results.skipped.push({ itemNumber: trimmedItemNumber, reason: '该客户已存在相同料号' });
            continue;
          }
          
          const updated = db.updateCustomerItemNumber(id, {
            customerId: parseInt(customerId),
            itemNumber: trimmedItemNumber,
            description: description || '',
            productId: productId ? parseInt(productId) : null
          });
          results.updated.push(updated);
        } else {
          results.skipped.push({ itemNumber: trimmedItemNumber, reason: '更新时未找到对应记录' });
        }
      } else {
        if (existingByNumber) {
          results.skipped.push({ itemNumber: trimmedItemNumber, reason: '该客户已存在相同料号' });
          continue;
        }

        const created = db.addCustomerItemNumber({
          customerId: parseInt(customerId),
          itemNumber: trimmedItemNumber,
          description: description || '',
          productId: productId ? parseInt(productId) : null
        });
        results.created.push(created);
      }
    }

    res.json({
      success: true,
      message: `批量操作完成：新增 ${results.created.length} 条，更新 ${results.updated.length} 条，跳过 ${results.skipped.length} 条`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/with-relations', authMiddleware, async (req, res) => {
  try {
    const customerItemNumbers = db.getAllCustomerItemNumbers();
    const customers = db.getAllCustomers();
    const products = db.getAllProducts();

    const result = customerItemNumbers.map(item => {
      const customer = customers.find(c => c.id === item.customerId);
      const product = item.productId ? products.find(p => p.id === item.productId) : null;
      
      return {
        ...item,
        customerName: customer ? customer.name : '未知客户',
        customerCode: customer ? customer.code : '',
        productDescription: product ? product.description : '',
        productItem: product ? product.item : ''
      };
    });

    res.json({ success: true, customerItemNumbers: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;