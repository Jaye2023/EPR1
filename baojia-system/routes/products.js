const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const excelService = require('../services/excelService');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const result = productService.getAllProducts(page, pageSize, search);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const search = req.query.search || '';
    const result = productService.getAllProducts(1, 1000, search);

    const outputPath = path.join(__dirname, '..', 'data', `products-${Date.now()}.xlsx`);
    await excelService.exportProductsToExcel(result.products, outputPath);

    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const product = productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '产品未找到' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const product = productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const product = productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ error: '产品未找到' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const deleted = productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '产品未找到' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const products = await excelService.importProductsFromExcel(req.file.path);
    const importedProducts = productService.importProducts(products);

    require('fs').unlinkSync(req.file.path);

    res.status(201).json({
      message: `成功导入 ${importedProducts.length} 个产品`,
      products: importedProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/calculate', (req, res) => {
  try {
    const product = productService.autoCalculateProductPrice(req.params.id);
    if (!product) {
      return res.status(404).json({ error: '产品未找到' });
    }
    res.json({
      message: '单价核算成功',
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/calculate-all', (req, res) => {
  try {
    const result = productService.autoCalculateAllProducts();
    res.json({
      message: `批量核算完成，共更新 ${result.updatedCount} 个产品`,
      updatedCount: result.updatedCount,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/parse', (req, res) => {
  try {
    const { description } = req.body;
    const parsedData = productService.parseDescription(description);
    const calculation = productService.calculatePrice(parsedData);
    
    res.json({
      parsedData,
      calculation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
