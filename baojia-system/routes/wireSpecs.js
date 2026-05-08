const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const specs = db.readWireSpecs();
    const search = req.query.search || '';
    
    const filteredSpecs = specs.filter(s => 
      s.spec.toLowerCase().includes(search.toLowerCase())
    );
    
    res.json({
      wireSpecs: filteredSpecs,
      total: filteredSpecs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings', (req, res) => {
  try {
    const settings = db.readSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const currentSettings = db.readSettings();
    const newSettings = { ...currentSettings, ...req.body };
    const savedSettings = db.writeSettings(newSettings);
    res.json(savedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:spec', (req, res) => {
  try {
    const spec = decodeURIComponent(req.params.spec);
    const wireSpec = db.getWireSpecBySpec(spec);
    
    if (!wireSpec) {
      return res.status(404).json({ error: '电线规格未找到' });
    }
    
    res.json(wireSpec);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:spec/calculate', authMiddleware, (req, res) => {
  try {
    const spec = decodeURIComponent(req.params.spec);
    const result = db.calculateWirePrice(spec);
    
    if (!result) {
      return res.status(404).json({ error: '电线规格未找到' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
