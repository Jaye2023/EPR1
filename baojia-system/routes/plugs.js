const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('./auth');
const xl = require('excel4node');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({
  dest: path.join(__dirname, '../data/uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const pageSize = 10;
    
    let plugs = db.getAllPlugs();
    
    if (search) {
      plugs = plugs.filter(plug => 
        plug.name.toLowerCase().includes(search.toLowerCase()) ||
        plug.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const total = plugs.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedPlugs = plugs.slice(start, end);
    
    res.json({ 
      success: true, 
      plugs: paginatedPlugs,
      page,
      totalPages,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const plug = db.getPlugById(parseFloat(req.params.id));
    if (!plug) {
      return res.status(404).json({ success: false, error: '插头不存在' });
    }
    res.json({ success: true, plug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, price, currency, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const newPlug = {
      id: Date.now(),
      name: name.trim(),
      price: parseFloat(price),
      currency: currency || 'RMB',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addPlug(newPlug);
    res.json({ success: true, plug: newPlug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, currency, description } = req.body;
    const plugId = parseFloat(req.params.id);

    const updatedPlug = db.updatePlug(plugId, {
      name: name?.trim(),
      price: price !== undefined ? parseFloat(price) : undefined,
      currency,
      description,
      updatedAt: new Date().toISOString()
    });

    if (!updatedPlug) {
      return res.status(404).json({ success: false, error: '插头不存在' });
    }

    res.json({ success: true, plug: updatedPlug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const success = db.deletePlug(parseFloat(req.params.id));
    if (!success) {
      return res.status(404).json({ success: false, error: '插头不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/usage', authMiddleware, async (req, res) => {
  try {
    const plugId = parseFloat(req.params.id);
    const plug = db.getPlugById(plugId);
    if (!plug) {
      return res.status(404).json({ success: false, error: '插头不存在' });
    }
    
    const processCards = db.getAllProcessCards().filter(card => card.plugId === plugId);
    const products = db.getAllProducts().filter(product => product.plugId === plugId);
    
    res.json({ 
      success: true, 
      processCards,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: '文件为空或格式不正确' });
    }

    const existingPlugs = db.getAllPlugs();
    const existingIds = new Set(existingPlugs.map(p => p.id));
    let importCount = 0;
    let skipCount = 0;

    for (const row of data) {
      const name = row['插头名称'] || row['name'];
      const price = parseFloat(row['单价'] || row['price'] || 0);
      const currency = row['币种'] || row['currency'] || 'RMB';
      const description = row['描述'] || row['description'] || '';

      if (!name || isNaN(price)) {
        continue;
      }

      const existing = existingPlugs.find(p => p.name === name);

      if (existing) {
        skipCount++;
      } else {
        let newId = Date.now();
        while (existingIds.has(newId)) {
          newId = Date.now() + Math.floor(Math.random() * 1000);
        }
        existingIds.add(newId);
        
        const newPlug = {
          id: newId,
          name: name.trim(),
          price,
          currency,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.addPlug(newPlug);
        importCount++;
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `导入完成：新增 ${importCount} 条，跳过重复 ${skipCount} 条`
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export', authMiddleware, async (req, res) => {
  try {
    const plugs = db.getAllPlugs();

    const workbook = new xl.Workbook();
    const worksheet = workbook.addWorksheet('插头价格');

    const headerStyle = workbook.createStyle({
      font: {
        bold: true,
        color: '#ffffff'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '#1a56db'
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      border: {
        left: { style: 'thin', color: '#cccccc' },
        right: { style: 'thin', color: '#cccccc' },
        top: { style: 'thin', color: '#cccccc' },
        bottom: { style: 'thin', color: '#cccccc' }
      }
    });

    const cellStyle = workbook.createStyle({
      alignment: {
        vertical: 'center'
      },
      border: {
        left: { style: 'thin', color: '#e0e0e0' },
        right: { style: 'thin', color: '#e0e0e0' },
        top: { style: 'thin', color: '#e0e0e0' },
        bottom: { style: 'thin', color: '#e0e0e0' }
      }
    });

    const priceStyle = workbook.createStyle({
      alignment: {
        horizontal: 'right',
        vertical: 'center'
      },
      border: {
        left: { style: 'thin', color: '#e0e0e0' },
        right: { style: 'thin', color: '#e0e0e0' },
        top: { style: 'thin', color: '#e0e0e0' },
        bottom: { style: 'thin', color: '#e0e0e0' }
      },
      numberFormat: '#,##0.00'
    });

    const dateStyle = workbook.createStyle({
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      border: {
        left: { style: 'thin', color: '#e0e0e0' },
        right: { style: 'thin', color: '#e0e0e0' },
        top: { style: 'thin', color: '#e0e0e0' },
        bottom: { style: 'thin', color: '#e0e0e0' }
      }
    });

    worksheet.cell(1, 1).string('序号').style(headerStyle);
    worksheet.cell(1, 2).string('插头名称').style(headerStyle);
    worksheet.cell(1, 3).string('单价').style(headerStyle);
    worksheet.cell(1, 4).string('币种').style(headerStyle);
    worksheet.cell(1, 5).string('描述').style(headerStyle);
    worksheet.cell(1, 6).string('创建时间').style(headerStyle);
    worksheet.cell(1, 7).string('更新时间').style(headerStyle);

    worksheet.column(1).setWidth(8);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(12);
    worksheet.column(4).setWidth(10);
    worksheet.column(5).setWidth(30);
    worksheet.column(6).setWidth(20);
    worksheet.column(7).setWidth(20);

    for (let i = 0; i < plugs.length; i++) {
      const plug = plugs[i];
      const rowNum = i + 2;
      
      worksheet.cell(rowNum, 1).number(i + 1).style(cellStyle);
      worksheet.cell(rowNum, 2).string(plug.name || '').style(cellStyle);
      worksheet.cell(rowNum, 3).number(plug.price || 0).style(priceStyle);
      worksheet.cell(rowNum, 4).string(plug.currency || 'RMB').style(cellStyle);
      worksheet.cell(rowNum, 5).string(plug.description || '').style(cellStyle);
      
      const createdAt = plug.createdAt ? formatDate(plug.createdAt) : '';
      const updatedAt = plug.updatedAt ? formatDate(plug.updatedAt) : '';
      worksheet.cell(rowNum, 6).string(createdAt).style(dateStyle);
      worksheet.cell(rowNum, 7).string(updatedAt).style(dateStyle);
    }

    const totalRow = plugs.length + 3;
    worksheet.cell(totalRow, 2).string('合计：').style(headerStyle);
    worksheet.cell(totalRow, 3).number(plugs.length).style(headerStyle);
    worksheet.cell(totalRow, 4).string('条记录').style(headerStyle);

    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    const filename = `插头价格_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);

    workbook.writeToBuffer().then(buffer => {
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr || '';
  }
}

module.exports = router;