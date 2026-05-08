const express = require('express');
const router = express.Router();
const db = require('../models/database');
const fs = require('fs');
const path = require('path');

/**
 * 系统诊断API
 * 用于检测和修复系统中的潜在问题
 */

// 系统健康检查
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

// 数据库完整性检查
router.get('/database', (req, res) => {
  try {
    const issues = [];
    const warnings = [];
    
    // 检查数据目录
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      issues.push({ type: 'error', message: '数据目录不存在', path: dataDir });
    } else {
      warnings.push({ type: 'info', message: '数据目录存在', path: dataDir });
    }
    
    // 检查必需的数据文件
    const requiredFiles = [
      'products.json',
      'quotes.json', 
      'quoteItems.json',
      'wireSpecs.json',
      'settings.json',
      'customers.json',
      'salespersons.json',
      'plugs.json',
      'tailProcessings.json',
      'processCards.json',
      'customerItemNumbers.json',
      'users.json',
      'sessions.json'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(dataDir, file);
      if (!fs.existsSync(filePath)) {
        issues.push({ type: 'error', message: `缺少必需的数据文件: ${file}`, path: filePath });
      } else {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          JSON.parse(content);
          warnings.push({ type: 'info', message: `数据文件正常: ${file}`, path: filePath });
        } catch (e) {
          issues.push({ type: 'error', message: `数据文件格式错误: ${file} - ${e.message}`, path: filePath });
        }
      }
    });
    
    // 检查设置是否完整
    try {
      const settings = db.readSettings();
      const requiredSettings = ['copperPrice', 'copperProcessFee', 'fillerPrice', 'profitMargin'];
      requiredSettings.forEach(setting => {
        if (settings[setting] === undefined || settings[setting] === null) {
          issues.push({ type: 'error', message: `缺少必需的设置项: ${setting}` });
        }
      });
      warnings.push({ type: 'info', message: '系统设置完整' });
    } catch (e) {
      issues.push({ type: 'error', message: `读取设置失败: ${e.message}` });
    }
    
    // 检查是否有管理员用户
    try {
      const users = db.readUsers();
      const admin = users.find(u => u.role === 'admin');
      if (!admin) {
        issues.push({ type: 'warning', message: '系统中没有管理员用户' });
      } else {
        warnings.push({ type: 'info', message: `管理员用户存在: ${admin.username}` });
      }
    } catch (e) {
      issues.push({ type: 'error', message: `读取用户数据失败: ${e.message}` });
    }
    
    res.json({
      success: true,
      data: {
        issues,
        warnings,
        totalIssues: issues.length,
        totalWarnings: warnings.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 修复数据库问题
router.post('/fix-database', (req, res) => {
  try {
    const fixes = [];
    const dataDir = path.join(__dirname, '..', 'data');
    
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      fixes.push({ type: 'success', message: '创建数据目录' });
    }
    
    // 重新初始化数据库（会创建缺失的文件）
    // 由于数据库类在导入时已初始化，我们需要手动检查
    const dbInstance = require('../models/database');
    
    // 验证所有数据文件
    const files = fs.readdirSync(dataDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          JSON.parse(content);
          fixes.push({ type: 'info', message: `验证通过: ${file}` });
        } catch (e) {
          // 如果文件格式错误，创建空数组
          fs.writeFileSync(filePath, JSON.stringify([], null, 2));
          fixes.push({ type: 'fixed', message: `修复损坏的文件: ${file}` });
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        fixes,
        message: '数据库修复完成'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取系统统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = {
      products: db.readProducts().length,
      quotes: db.readQuotes().length,
      customers: db.readCustomers().length,
      salespersons: db.readSalespersons().length,
      plugs: db.readPlugs().length,
      tailProcessings: db.readTailProcessings().length,
      processCards: db.readProcessCards().length,
      wireSpecs: db.readWireSpecs().length,
      users: db.readUsers().length,
      sessions: db.readSessions().length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清理过期会话
router.post('/cleanup-sessions', (req, res) => {
  try {
    const beforeCount = db.readSessions().length;
    db.cleanExpiredSessions();
    const afterCount = db.readSessions().length;
    const cleanedCount = beforeCount - afterCount;
    
    res.json({
      success: true,
      data: {
        cleanedCount,
        remainingCount: afterCount
      },
      message: `清理了 ${cleanedCount} 个过期会话，剩余 ${afterCount} 个有效会话`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;