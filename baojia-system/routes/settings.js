const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware, adminMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const settings = db.readSettings();
    res.json(settings);
  } catch (error) {
    console.error('读取设置失败:', error);
    res.status(500).json({ error: '读取设置失败' });
  }
});

router.put('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const settings = req.body;
    const updatedSettings = db.writeSettings(settings);
    res.json({ message: '设置保存成功', settings: updatedSettings });
  } catch (error) {
    console.error('保存设置失败:', error);
    res.status(500).json({ error: '保存设置失败' });
  }
});

module.exports = router;