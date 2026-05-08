const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const tailProcessings = db.getAllTailProcessings();
    res.json({ success: true, tailProcessings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tailProcessing = db.getTailProcessingById(parseInt(req.params.id));
    if (!tailProcessing) {
      return res.status(404).json({ success: false, message: '尾部处理不存在' });
    }
    res.json({ success: true, tailProcessing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, currency, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const newTailProcessing = {
      id: Date.now(),
      name: name.trim(),
      price: parseFloat(price),
      currency: currency || 'RMB',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.addTailProcessing(newTailProcessing);
    res.json({ success: true, tailProcessing: newTailProcessing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, price, currency, description } = req.body;
    const id = parseInt(req.params.id);
    
    const updatedTailProcessing = db.updateTailProcessing(id, {
      name: name?.trim(),
      price: price !== undefined ? parseFloat(price) : undefined,
      currency,
      description,
      updatedAt: new Date().toISOString()
    });
    
    if (!updatedTailProcessing) {
      return res.status(404).json({ success: false, message: '尾部处理不存在' });
    }
    
    res.json({ success: true, tailProcessing: updatedTailProcessing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = db.deleteTailProcessing(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ success: false, message: '尾部处理不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;