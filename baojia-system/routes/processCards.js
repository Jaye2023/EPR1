const express = require('express');
const router = express.Router();
const db = require('../models/database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('./auth');

// 创建CAD上传目录
const cadUploadDir = path.join(__dirname, '..', 'uploads', 'cad');
if (!fs.existsSync(cadUploadDir)) {
  fs.mkdirSync(cadUploadDir, { recursive: true });
}

// 配置multer上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, cadUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `cad_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.dwg', '.dxf', '.pdf', '.dwf', '.step', '.stp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传CAD图纸格式文件（.dwg, .dxf, .pdf, .dwf, .step, .stp）'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB限制
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const processCards = db.getAllProcessCards();
    res.json({ success: true, processCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const processCard = db.getProcessCardById(req.params.id);
    if (!processCard) {
      return res.status(404).json({ success: false, message: '料号不存在' });
    }
    res.json({ success: true, processCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, description, productId, customerItemNumberId } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: '缺少必要参数（料号编码和名称）' });
    }

    const newProcessCard = {
      code: code.trim(),
      name: name.trim(),
      description: description || '',
      productId: productId ? parseInt(productId) : null,
      customerItemNumberId: customerItemNumberId ? parseInt(customerItemNumberId) : null,
      cadFilePath: null
    };

    db.addProcessCard(newProcessCard);
    res.json({ success: true, processCard: newProcessCard });
  } catch (error) {
    if (error.message.includes('已存在') || error.message.includes('已被其他料号关联')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, productId, customerItemNumberId } = req.body;
    const updatedFields = {};
    if (code) updatedFields.code = code.trim();
    if (name) updatedFields.name = name.trim();
    if (description !== undefined) updatedFields.description = description;
    if (productId !== undefined) updatedFields.productId = productId ? parseInt(productId) : null;
    if (customerItemNumberId !== undefined) updatedFields.customerItemNumberId = customerItemNumberId ? parseInt(customerItemNumberId) : null;

    const updated = db.updateProcessCard(req.params.id, updatedFields);
    if (!updated) {
      return res.status(404).json({ success: false, message: '料号不存在' });
    }
    res.json({ success: true, processCard: updated });
  } catch (error) {
    if (error.message.includes('已存在') || error.message.includes('已被其他料号关联')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = db.deleteProcessCard(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: '料号不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/by-product/:productId', async (req, res) => {
  try {
    const processCards = db.getAllProcessCards();
    const card = processCards.find(p => p.productId === parseInt(req.params.productId));
    if (!card) {
      return res.status(404).json({ success: false, message: '未找到关联的料号' });
    }
    res.json({ success: true, processCard: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/by-customer-item/:itemId', async (req, res) => {
  try {
    const processCards = db.getAllProcessCards();
    const card = processCards.find(p => p.customerItemNumberId === parseInt(req.params.itemId));
    if (!card) {
      return res.status(404).json({ success: false, message: '未找到关联的料号' });
    }
    res.json({ success: true, processCard: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 上传CAD图纸（仅管理员可操作）
router.post('/:id/upload-cad', upload.single('cadFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    const updated = db.setProcessCardCadFile(req.params.id, req.file.filename);
    if (!updated) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: '料号不存在' });
    }

    res.json({ 
      success: true, 
      message: 'CAD图纸上传成功',
      filename: req.file.originalname,
      filePath: `/uploads/cad/${req.file.filename}`
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 查看CAD图纸（只读权限）
router.get('/:id/view-cad', async (req, res) => {
  try {
    const filePath = db.getProcessCardFilePath(req.params.id);
    if (!filePath) {
      return res.status(404).json({ success: false, message: '该料号暂无CAD图纸' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '图纸文件不存在' });
    }

    // 设置响应头，允许查看但禁止修改
    res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // 根据文件类型设置Content-Type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.dwg': 'application/acad',
      '.dxf': 'application/dxf',
      '.pdf': 'application/pdf',
      '.dwf': 'application/dwf',
      '.step': 'application/step',
      '.stp': 'application/step'
    };
    
    res.setHeader('Content-Type', contentTypeMap[ext] || 'application/octet-stream');
    
    // 创建只读流
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除CAD图纸（仅管理员可操作）
router.delete('/:id/remove-cad', async (req, res) => {
  try {
    const updated = db.removeProcessCardCadFile(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: '料号不存在' });
    }
    res.json({ success: true, message: 'CAD图纸已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;