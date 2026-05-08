const express = require('express');
const router = express.Router();
const quoteService = require('../services/quoteService');
const excelService = require('../services/excelService');
const pdfService = require('../services/pdfService');
const path = require('path');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const result = quoteService.getAllQuotes(page, pageSize, search, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const quote = quoteService.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: '报价单未找到' });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const quote = quoteService.createQuote(req.body);
    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const quote = quoteService.updateQuote(req.params.id, req.body);
    if (!quote) {
      return res.status(404).json({ error: '报价单未找到' });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = quoteService.deleteQuote(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '报价单未找到' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/copy', (req, res) => {
  try {
    const copiedQuote = quoteService.copyQuote(req.params.id);
    if (!copiedQuote) {
      return res.status(404).json({ error: '报价单未找到' });
    }
    res.status(201).json(copiedQuote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const quote = quoteService.updateQuoteStatus(req.params.id, status);
    if (!quote) {
      return res.status(404).json({ error: '报价单未找到' });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/export/excel', async (req, res) => {
  try {
    const quote = quoteService.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: '报价单未找到' });
    }

    const outputPath = path.join(__dirname, '..', 'data', `quote-${quote.quoteNumber}.xlsx`);
    await excelService.exportQuoteToExcel(quote, outputPath);

    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/export/pdf', async (req, res) => {
  try {
    const quote = quoteService.getQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: '报价单未找到' });
    }

    const outputPath = path.join(__dirname, '..', 'data', `quote-${quote.quoteNumber}.pdf`);
    await pdfService.exportQuoteToPDF(quote, outputPath);

    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
