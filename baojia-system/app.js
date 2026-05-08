const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/products');
const quoteRoutes = require('./routes/quotes');
const wireSpecRoutes = require('./routes/wireSpecs');
const customerRoutes = require('./routes/customers');
const salespersonRoutes = require('./routes/salespersons');
const plugRoutes = require('./routes/plugs');
const tailProcessingRoutes = require('./routes/tailProcessings');
const processCardRoutes = require('./routes/processCards');
const customerItemNumberRoutes = require('./routes/customerItemNumbers');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const erpRoutes = require('./routes/erp');
const diagnosticsRoutes = require('./routes/diagnostics');

app.use('/api', indexRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/wire-specs', wireSpecRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/salespersons', salespersonRoutes);
app.use('/api/plugs', plugRoutes);
app.use('/api/tail-processings', tailProcessingRoutes);
app.use('/api/process-cards', processCardRoutes);
app.use('/api/customer-item-numbers', customerItemNumberRoutes);
app.use('/api/auth', authRoutes);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'products.html'));
});

app.get('/products/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'product-form.html'));
});

app.get('/products/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'product-detail.html'));
});

app.get('/products/:id/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'product-form.html'));
});

app.get('/quotes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'quotes.html'));
});

app.get('/quotes/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'quote-form.html'));
});

app.get('/quotes/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'quote-detail.html'));
});

app.get('/quotes/:id/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'quote-form.html'));
});

app.get('/wire-specs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'wire-specs.html'));
});

app.get('/customers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'customers.html'));
});

app.get('/salespersons', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'salespersons.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'settings.html'));
});

app.get('/plugs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'plugs.html'));
});

app.get('/tail-processings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'tail-processings.html'));
});

app.get('/process-cards', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'process-cards.html'));
});

app.get('/customer-item-numbers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'customer-item-numbers.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`报价系统已启动: http://localhost:${PORT}`);
});
