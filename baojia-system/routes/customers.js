const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../models/database');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'data', 'uploads', 'customers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', customerType = '' } = req.query;
    let customers = db.readCustomers();
    
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.customerNo.toLowerCase().includes(searchLower) ||
        c.contactPerson.toLowerCase().includes(searchLower) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (customerType) {
      customers = customers.filter(c => c.customerType === customerType);
    }
    
    const total = customers.length;
    const start = (page - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const paginatedCustomers = customers.slice(start, end);
    
    res.json({ 
      success: true, 
      customers: paginatedCustomers,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, shippingAddress, paymentMethod, customerType, taxNo, bankName, bankAccount, remarks, customerNo } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '客户名称不能为空' });
    }

    const customer = db.createCustomer({
      customerNo: customerNo?.trim() || '',
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      shippingAddress: shippingAddress?.trim() || '',
      paymentMethod: paymentMethod?.trim() || '',
      customerType: customerType?.trim() || '',
      taxNo: taxNo?.trim() || '',
      bankName: bankName?.trim() || '',
      bankAccount: bankAccount?.trim() || '',
      remarks: remarks?.trim() || ''
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, shippingAddress, paymentMethod, customerType, taxNo, bankName, bankAccount, remarks, customerNo } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '客户名称不能为空' });
    }

    const customer = db.updateCustomer(req.params.id, {
      customerNo: customerNo?.trim() || '',
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      shippingAddress: shippingAddress?.trim() || '',
      paymentMethod: paymentMethod?.trim() || '',
      customerType: customerType?.trim() || '',
      taxNo: taxNo?.trim() || '',
      bankName: bankName?.trim() || '',
      bankAccount: bankAccount?.trim() || '',
      remarks: remarks?.trim() || ''
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const success = db.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/attachments', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择要上传的文件' });
    }

    const attachment = db.addCustomerAttachment(req.params.id, req.file);
    if (!attachment) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    res.status(201).json({ success: true, attachment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/attachments', (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }
    res.json({ success: true, attachments: customer.attachments || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:customerId/attachments/:attachmentId', (req, res) => {
  try {
    const success = db.removeCustomerAttachment(req.params.customerId, req.params.attachmentId);
    if (!success) {
      return res.status(404).json({ success: false, error: '客户或附件不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:customerId/attachments/:attachmentId/download', (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }

    const attachment = (customer.attachments || []).find(a => a.id === parseInt(req.params.attachmentId));
    if (!attachment) {
      return res.status(404).json({ success: false, error: '附件不存在' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;