const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const salespersons = db.readSalespersons();
    res.json({ success: true, salespersons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const salesperson = db.getSalespersonById(req.params.id);
    if (!salesperson) {
      return res.status(404).json({ success: false, error: '报价人不存在' });
    }
    res.json({ success: true, salesperson });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email, department } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '姓名不能为空' });
    }

    const salesperson = db.createSalesperson({
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      department: department?.trim() || '销售部'
    });

    res.status(201).json({ success: true, salesperson });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, department } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '姓名不能为空' });
    }

    const salesperson = db.updateSalesperson(req.params.id, {
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      department: department?.trim() || '销售部'
    });

    if (!salesperson) {
      return res.status(404).json({ success: false, error: '报价人不存在' });
    }

    res.json({ success: true, salesperson });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const success = db.deleteSalesperson(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: '报价人不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;