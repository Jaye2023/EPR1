const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.productsFile = path.join(this.dataDir, 'products.json');
    this.quotesFile = path.join(this.dataDir, 'quotes.json');
    this.quoteItemsFile = path.join(this.dataDir, 'quoteItems.json');
    this.wireSpecsFile = path.join(this.dataDir, 'wireSpecs.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.customersFile = path.join(this.dataDir, 'customers.json');
    this.salespersonsFile = path.join(this.dataDir, 'salespersons.json');
    this.plugsFile = path.join(this.dataDir, 'plugs.json');
    this.tailProcessingsFile = path.join(this.dataDir, 'tailProcessings.json');
    this.processCardsFile = path.join(this.dataDir, 'processCards.json');
    this.customerItemNumbersFile = path.join(this.dataDir, 'customerItemNumbers.json');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.productsFile)) {
      fs.writeFileSync(this.productsFile, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(this.quotesFile)) {
      fs.writeFileSync(this.quotesFile, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(this.quoteItemsFile)) {
      fs.writeFileSync(this.quoteItemsFile, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(this.wireSpecsFile)) {
      fs.writeFileSync(this.wireSpecsFile, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(this.settingsFile)) {
      const defaultSettings = {
        copperPrice: 100000,
        copperProcessFee: 2000,
        fillerPrice: 8000,  // 填充材料价格(元/吨)
        // PVC线胶料价格
        pvcMaterialPriceEU: 15000,  // 欧标/国标/日规/台规统一价格
        pvcMaterialPriceUS: 18000,  // 美规单独价格
        // 橡胶线胶料价格
        rubberMaterialPriceEU: 25000,  // 欧规橡胶线
        rubberMaterialPriceUS: 28000,  // 美规橡胶线
        profitMargin: 0.85,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.settingsFile, JSON.stringify(defaultSettings, null, 2));
    }

    if (!fs.existsSync(this.customersFile)) {
      const defaultCustomers = [
        {
          id: 1,
          name: '客户A',
          contactPerson: '覃小姐',
          phone: '13800138001',
          email: 'contact@customera.com',
          address: '广东省中山市',
          shippingAddress: '广东省中山市XX工业区XX路XX号',
          paymentMethod: '月结 60 天（以电汇或银行承兑汇票结清）',
          attachments: [],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: '客户B',
          contactPerson: '李先生',
          phone: '13800138002',
          email: 'contact@customerb.com',
          address: '广东省广州市',
          shippingAddress: '广东省广州市XX区XX路XX号',
          paymentMethod: '月结 30 天（电汇）',
          attachments: [],
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.customersFile, JSON.stringify(defaultCustomers, null, 2));
    }

    if (!fs.existsSync(this.salespersonsFile)) {
      const defaultSalespersons = [
        {
          id: 1,
          name: '朱建云',
          phone: '13800138000',
          email: 'zhujy@gdmainland.com',
          department: '销售部',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: '张三',
          phone: '13800138003',
          email: 'zhangsan@gdmainland.com',
          department: '销售部',
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.salespersonsFile, JSON.stringify(defaultSalespersons, null, 2));
    }

    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers = [
        {
          id: 1,
          username: 'admin',
          password: 'admin123',
          name: '管理员',
          email: 'admin@gdmainland.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(this.usersFile, JSON.stringify(defaultUsers, null, 2));
    }

    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, JSON.stringify([], null, 2));
    }
  }

  readSettings() {
    const data = fs.readFileSync(this.settingsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeSettings(settings) {
    settings.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
    return settings;
  }

  calculateWirePrice(spec) {
    const wireSpec = this.getWireSpecBySpec(spec);
    if (!wireSpec) return null;

    const settings = this.readSettings();
    const copperInGrams = wireSpec.copper || 0;
    const materialInGrams = wireSpec.material || 0;
    const fillerInGrams = wireSpec.filler || 0;

    const copperPricePerTon = settings.copperPrice || 68000;
    
    // 根据电线规格类型选择胶料价格
    let materialPricePerTon;
    let wireType = '';
    
    // 判断电线类型
    if (spec.includes('RR-F')) {
      wireType = '橡胶线(欧规)';
      materialPricePerTon = settings.rubberMaterialPriceEU || 18000;
    } else if (spec.includes('HPN')) {
      wireType = '橡胶线(美规)';
      materialPricePerTon = settings.rubberMaterialPriceUS || 18000;
    } else if (spec.includes('SPT') || spec.includes('SVT') || spec.includes('SJT') || spec.includes('NISPT')) {
      wireType = 'PVC线(美规)';
      materialPricePerTon = settings.pvcMaterialPriceUS || 12000;
    } else {
      wireType = 'PVC线(欧标/国标/日规/台规)';
      materialPricePerTon = settings.pvcMaterialPriceEU || 12000;
    }
    
    // 根据电线类型选择毛利率
    let profitMargin;
    if (wireType.includes('橡胶线')) {
      profitMargin = settings.profitMarginRubber || settings.profitMargin || 0.8;
    } else {
      profitMargin = settings.profitMarginPVC || settings.profitMargin || 0.85;
    }
    const fillerPricePerTon = settings.fillerPrice || 8000;

    const copperCost = (copperInGrams / 1000) * copperPricePerTon / 1000;
    const materialCost = (materialInGrams / 1000) * materialPricePerTon / 1000;
    const fillerCost = (fillerInGrams / 1000) * fillerPricePerTon / 1000;

    const basePrice = copperCost + materialCost + fillerCost;
    const finalPrice = basePrice / profitMargin;

    return {
      spec: spec,
      type: wireType,
      copper: copperInGrams,
      material: materialInGrams,
      filler: fillerInGrams,
      materialPricePerTon: materialPricePerTon,
      fillerPricePerTon: fillerPricePerTon,
      copperCost: copperCost,
      materialCost: materialCost,
      fillerCost: fillerCost,
      basePrice: basePrice,
      finalPrice: finalPrice,
      settings: settings
    };
  }

  readWireSpecs() {
    const data = fs.readFileSync(this.wireSpecsFile, 'utf-8');
    return JSON.parse(data);
  }

  getWireSpecBySpec(spec) {
    const specs = this.readWireSpecs();
    // 先尝试精确匹配
    let found = specs.find(s => s.spec === spec);
    if (found) return found;
    
    // 如果精确匹配失败，尝试去除空格后匹配
    const normalizedSpec = spec.replace(/\s+/g, '');
    found = specs.find(s => s.spec.replace(/\s+/g, '') === normalizedSpec);
    if (found) return found;
    
    // 如果还没找到，尝试模糊匹配
    found = specs.find(s => s.spec.includes(spec) || spec.includes(s.spec));
    return found;
  }

  readProducts() {
    const data = fs.readFileSync(this.productsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeProducts(products) {
    fs.writeFileSync(this.productsFile, JSON.stringify(products, null, 2));
  }

  readQuotes() {
    const data = fs.readFileSync(this.quotesFile, 'utf-8');
    return JSON.parse(data);
  }

  writeQuotes(quotes) {
    fs.writeFileSync(this.quotesFile, JSON.stringify(quotes, null, 2));
  }

  readQuoteItems() {
    const data = fs.readFileSync(this.quoteItemsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeQuoteItems(quoteItems) {
    fs.writeFileSync(this.quoteItemsFile, JSON.stringify(quoteItems, null, 2));
  }

  generateId(collection) {
    const items = collection === 'products' ? this.readProducts() :
                  collection === 'quotes' ? this.readQuotes() :
                  this.readQuoteItems();
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
  }

  generateQuoteNumber() {
    const quotes = this.readQuotes();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = quotes.filter(q => q.quoteNumber.startsWith(`QT${year}${month}${day}`)).length + 1;
    return `QT${year}${month}${day}${String(count).padStart(3, '0')}`;
  }

  readCustomers() {
    const data = fs.readFileSync(this.customersFile, 'utf-8');
    return JSON.parse(data);
  }

  writeCustomers(customers) {
    fs.writeFileSync(this.customersFile, JSON.stringify(customers, null, 2));
    return customers;
  }

  getCustomerById(id) {
    const customers = this.readCustomers();
    return customers.find(c => c.id === parseInt(id));
  }

  getCustomerByName(name) {
    const customers = this.readCustomers();
    return customers.find(c => c.name === name);
  }

  createCustomer(customer) {
    const customers = this.readCustomers();
    const id = customers.length === 0 ? 1 : Math.max(...customers.map(c => c.id)) + 1;
    const newCustomer = {
      id,
      ...customer,
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    this.writeCustomers(customers);
    return newCustomer;
  }

  updateCustomer(id, customerData) {
    const customers = this.readCustomers();
    const index = customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) return null;
    customers[index] = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date().toISOString()
    };
    this.writeCustomers(customers);
    return customers[index];
  }

  deleteCustomer(id) {
    const customers = this.readCustomers();
    const filtered = customers.filter(c => c.id !== parseInt(id));
    if (filtered.length === customers.length) return false;
    this.writeCustomers(filtered);
    return true;
  }

  addCustomerAttachment(customerId, attachment) {
    const customers = this.readCustomers();
    const index = customers.findIndex(c => c.id === parseInt(customerId));
    if (index === -1) return null;

    if (!customers[index].attachments) {
      customers[index].attachments = [];
    }

    const newAttachment = {
      id: Date.now(),
      filename: attachment.filename,
      originalName: attachment.originalname,
      mimetype: attachment.mimetype,
      size: attachment.size,
      path: attachment.path,
      uploadedAt: new Date().toISOString()
    };

    customers[index].attachments.push(newAttachment);
    customers[index].updatedAt = new Date().toISOString();
    this.writeCustomers(customers);
    return newAttachment;
  }

  removeCustomerAttachment(customerId, attachmentId) {
    const customers = this.readCustomers();
    const index = customers.findIndex(c => c.id === parseInt(customerId));
    if (index === -1) return false;

    if (!customers[index].attachments) {
      return false;
    }

    const attachmentIndex = customers[index].attachments.findIndex(a => a.id === parseInt(attachmentId));
    if (attachmentIndex === -1) return false;

    const removed = customers[index].attachments.splice(attachmentIndex, 1)[0];
    customers[index].updatedAt = new Date().toISOString();
    this.writeCustomers(customers);

    if (fs.existsSync(removed.path)) {
      fs.unlinkSync(removed.path);
    }

    return true;
  }

  readSalespersons() {
    const data = fs.readFileSync(this.salespersonsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeSalespersons(salespersons) {
    fs.writeFileSync(this.salespersonsFile, JSON.stringify(salespersons, null, 2));
    return salespersons;
  }

  getSalespersonById(id) {
    const salespersons = this.readSalespersons();
    return salespersons.find(s => s.id === parseInt(id));
  }

  getSalespersonByName(name) {
    const salespersons = this.readSalespersons();
    return salespersons.find(s => s.name === name);
  }

  createSalesperson(salesperson) {
    const salespersons = this.readSalespersons();
    const id = salespersons.length === 0 ? 1 : Math.max(...salespersons.map(s => s.id)) + 1;
    const newSalesperson = {
      id,
      ...salesperson,
      createdAt: new Date().toISOString()
    };
    salespersons.push(newSalesperson);
    this.writeSalespersons(salespersons);
    return newSalesperson;
  }

  updateSalesperson(id, salespersonData) {
    const salespersons = this.readSalespersons();
    const index = salespersons.findIndex(s => s.id === parseInt(id));
    if (index === -1) return null;
    salespersons[index] = {
      ...salespersons[index],
      ...salespersonData,
      updatedAt: new Date().toISOString()
    };
    this.writeSalespersons(salespersons);
    return salespersons[index];
  }

  deleteSalesperson(id) {
    const salespersons = this.readSalespersons();
    const filtered = salespersons.filter(s => s.id !== parseInt(id));
    if (filtered.length === salespersons.length) return false;
    this.writeSalespersons(filtered);
    return true;
  }

  readPlugs() {
    const data = fs.readFileSync(this.plugsFile, 'utf-8');
    return JSON.parse(data);
  }

  writePlugs(plugs) {
    fs.writeFileSync(this.plugsFile, JSON.stringify(plugs, null, 2));
    return plugs;
  }

  getAllPlugs() {
    return this.readPlugs();
  }

  getPlugById(id) {
    const plugs = this.readPlugs();
    const numId = typeof id === 'number' ? id : parseFloat(id);
    return plugs.find(p => p.id === numId);
  }

  getPlugByName(name) {
    const plugs = this.readPlugs();
    return plugs.find(p => p.name === name);
  }

  addPlug(plug) {
    const plugs = this.readPlugs();
    plugs.push(plug);
    this.writePlugs(plugs);
    return plug;
  }

  updatePlug(id, plugData) {
    const plugs = this.readPlugs();
    const numId = typeof id === 'number' ? id : parseFloat(id);
    const index = plugs.findIndex(p => p.id === numId);
    if (index === -1) return null;
    
    const updatedFields = {};
    if (plugData.name !== undefined) updatedFields.name = plugData.name;
    if (plugData.price !== undefined) updatedFields.price = plugData.price;
    if (plugData.currency !== undefined) updatedFields.currency = plugData.currency;
    if (plugData.description !== undefined) updatedFields.description = plugData.description;
    if (plugData.updatedAt !== undefined) updatedFields.updatedAt = plugData.updatedAt;
    
    plugs[index] = {
      ...plugs[index],
      ...updatedFields
    };
    this.writePlugs(plugs);
    return plugs[index];
  }

  deletePlug(id) {
    const plugs = this.readPlugs();
    const numId = typeof id === 'number' ? id : parseFloat(id);
    const filtered = plugs.filter(p => p.id !== numId);
    if (filtered.length === plugs.length) return false;
    this.writePlugs(filtered);
    return true;
  }

  readTailProcessings() {
    const data = fs.readFileSync(this.tailProcessingsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeTailProcessings(tailProcessings) {
    fs.writeFileSync(this.tailProcessingsFile, JSON.stringify(tailProcessings, null, 2));
    return tailProcessings;
  }

  getAllTailProcessings() {
    return this.readTailProcessings();
  }

  getTailProcessingById(id) {
    const tailProcessings = this.readTailProcessings();
    return tailProcessings.find(t => t.id === parseInt(id));
  }

  getTailProcessingByName(name) {
    const tailProcessings = this.readTailProcessings();
    return tailProcessings.find(t => t.name === name);
  }

  addTailProcessing(tailProcessing) {
    const tailProcessings = this.readTailProcessings();
    tailProcessings.push(tailProcessing);
    this.writeTailProcessings(tailProcessings);
    return tailProcessing;
  }

  updateTailProcessing(id, tailProcessingData) {
    const tailProcessings = this.readTailProcessings();
    const index = tailProcessings.findIndex(t => t.id === parseInt(id));
    if (index === -1) return null;
    
    const updatedFields = {};
    if (tailProcessingData.name !== undefined) updatedFields.name = tailProcessingData.name;
    if (tailProcessingData.price !== undefined) updatedFields.price = tailProcessingData.price;
    if (tailProcessingData.currency !== undefined) updatedFields.currency = tailProcessingData.currency;
    if (tailProcessingData.description !== undefined) updatedFields.description = tailProcessingData.description;
    if (tailProcessingData.updatedAt !== undefined) updatedFields.updatedAt = tailProcessingData.updatedAt;
    
    tailProcessings[index] = {
      ...tailProcessings[index],
      ...updatedFields
    };
    this.writeTailProcessings(tailProcessings);
    return tailProcessings[index];
  }

  deleteTailProcessing(id) {
    const tailProcessings = this.readTailProcessings();
    const filtered = tailProcessings.filter(t => t.id !== parseInt(id));
    if (filtered.length === tailProcessings.length) return false;
    this.writeTailProcessings(filtered);
    return true;
  }

  // 料号相关方法
  readProcessCards() {
    if (!fs.existsSync(this.processCardsFile)) {
      return [];
    }
    const data = fs.readFileSync(this.processCardsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeProcessCards(processCards) {
    fs.writeFileSync(this.processCardsFile, JSON.stringify(processCards, null, 2));
    return processCards;
  }

  getAllProcessCards() {
    return this.readProcessCards();
  }

  getProcessCardById(id) {
    const processCards = this.readProcessCards();
    return processCards.find(p => p.id === parseInt(id));
  }

  getProcessCardByCode(code) {
    const processCards = this.readProcessCards();
    return processCards.find(p => p.code === code);
  }

  addProcessCard(processCard) {
    const processCards = this.readProcessCards();
    
    // 检查料号编码是否已存在
    if (processCards.some(p => p.code === processCard.code)) {
      throw new Error('料号编码已存在');
    }
    
    // 检查产品规格是否已被其他料号关联
    if (processCard.productId && processCards.some(p => p.productId === processCard.productId)) {
      throw new Error('该产品规格已被其他料号关联');
    }
    
    // 检查客户料号是否已被其他料号关联
    if (processCard.customerItemNumberId && processCards.some(p => p.customerItemNumberId === processCard.customerItemNumberId)) {
      throw new Error('该客户料号已被其他料号关联');
    }
    
    const id = processCards.length === 0 ? 1 : Math.max(...processCards.map(p => p.id)) + 1;
    const newProcessCard = {
      id,
      ...processCard,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    processCards.push(newProcessCard);
    this.writeProcessCards(processCards);
    return newProcessCard;
  }

  updateProcessCard(id, processCardData) {
    const processCards = this.readProcessCards();
    const index = processCards.findIndex(p => p.id === parseInt(id));
    if (index === -1) return null;
    
    // 检查料号编码是否与其他料号重复
    if (processCardData.code && processCards.some(p => p.id !== parseInt(id) && p.code === processCardData.code)) {
      throw new Error('料号编码已存在');
    }
    
    // 检查产品规格是否已被其他料号关联
    if (processCardData.productId !== undefined && processCards.some(p => p.id !== parseInt(id) && p.productId === processCardData.productId)) {
      throw new Error('该产品规格已被其他料号关联');
    }
    
    // 检查客户料号是否已被其他料号关联
    if (processCardData.customerItemNumberId !== undefined && processCards.some(p => p.id !== parseInt(id) && p.customerItemNumberId === processCardData.customerItemNumberId)) {
      throw new Error('该客户料号已被其他料号关联');
    }
    
    processCards[index] = {
      ...processCards[index],
      ...processCardData,
      updatedAt: new Date().toISOString()
    };
    this.writeProcessCards(processCards);
    return processCards[index];
  }

  deleteProcessCard(id) {
    const processCards = this.readProcessCards();
    const filtered = processCards.filter(p => p.id !== parseInt(id));
    if (filtered.length === processCards.length) return false;
    this.writeProcessCards(filtered);
    return true;
  }

  // 料号图纸相关方法
  getProcessCardFilePath(processCardId) {
    const processCard = this.getProcessCardById(processCardId);
    if (!processCard || !processCard.cadFilePath) return null;
    return path.join(__dirname, '..', processCard.cadFilePath);
  }

  setProcessCardCadFile(processCardId, filename) {
    const processCards = this.readProcessCards();
    const index = processCards.findIndex(p => p.id === parseInt(processCardId));
    if (index === -1) return null;
    
    processCards[index] = {
      ...processCards[index],
      cadFilePath: `uploads/cad/${filename}`,
      updatedAt: new Date().toISOString()
    };
    this.writeProcessCards(processCards);
    return processCards[index];
  }

  removeProcessCardCadFile(processCardId) {
    const processCards = this.readProcessCards();
    const index = processCards.findIndex(p => p.id === parseInt(processCardId));
    if (index === -1) return null;
    
    const oldFilePath = this.getProcessCardFilePath(processCardId);
    if (oldFilePath && fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
    
    processCards[index] = {
      ...processCards[index],
      cadFilePath: null,
      updatedAt: new Date().toISOString()
    };
    this.writeProcessCards(processCards);
    return processCards[index];
  }

  // 客户料号相关方法
  readCustomerItemNumbers() {
    if (!fs.existsSync(this.customerItemNumbersFile)) {
      return [];
    }
    const data = fs.readFileSync(this.customerItemNumbersFile, 'utf-8');
    return JSON.parse(data);
  }

  writeCustomerItemNumbers(customerItemNumbers) {
    fs.writeFileSync(this.customerItemNumbersFile, JSON.stringify(customerItemNumbers, null, 2));
    return customerItemNumbers;
  }

  getAllCustomerItemNumbers() {
    return this.readCustomerItemNumbers();
  }

  getCustomerItemNumberById(id) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    return customerItemNumbers.find(c => c.id === parseInt(id));
  }

  addCustomerItemNumber(customerItemNumber) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    const id = customerItemNumbers.length === 0 ? 1 : Math.max(...customerItemNumbers.map(c => c.id)) + 1;
    const newItemNumber = {
      id,
      ...customerItemNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customerItemNumbers.push(newItemNumber);
    this.writeCustomerItemNumbers(customerItemNumbers);
    return newItemNumber;
  }

  updateCustomerItemNumber(id, customerItemNumberData) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    const index = customerItemNumbers.findIndex(c => c.id === parseInt(id));
    if (index === -1) return null;
    
    customerItemNumbers[index] = {
      ...customerItemNumbers[index],
      ...customerItemNumberData,
      updatedAt: new Date().toISOString()
    };
    this.writeCustomerItemNumbers(customerItemNumbers);
    return customerItemNumbers[index];
  }

  deleteCustomerItemNumber(id) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    const filtered = customerItemNumbers.filter(c => c.id !== parseInt(id));
    if (filtered.length === customerItemNumbers.length) return false;
    this.writeCustomerItemNumbers(filtered);
    return true;
  }

  getCustomerItemNumbersByCustomerId(customerId) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    return customerItemNumbers.filter(c => c.customerId === parseInt(customerId));
  }

  getCustomerItemNumbersByProductId(productId) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    return customerItemNumbers.filter(c => c.productId === parseInt(productId));
  }

  linkProductToCustomerItem(itemNumberId, productId) {
    const customerItemNumbers = this.readCustomerItemNumbers();
    const index = customerItemNumbers.findIndex(c => c.id === parseInt(itemNumberId));
    if (index === -1) return null;
    
    customerItemNumbers[index] = {
      ...customerItemNumbers[index],
      productId: parseInt(productId),
      updatedAt: new Date().toISOString()
    };
    this.writeCustomerItemNumbers(customerItemNumbers);
    return customerItemNumbers[index];
  }

  readUsers() {
    const data = fs.readFileSync(this.usersFile, 'utf-8');
    return JSON.parse(data);
  }

  writeUsers(users) {
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
    return users;
  }

  getUserById(id) {
    const users = this.readUsers();
    return users.find(u => u.id === parseInt(id));
  }

  getUserByUsername(username) {
    const users = this.readUsers();
    return users.find(u => u.username === username);
  }

  createUser(user) {
    const users = this.readUsers();
    if (users.some(u => u.username === user.username)) {
      throw new Error('用户名已存在');
    }
    const id = users.length === 0 ? 1 : Math.max(...users.map(u => u.id)) + 1;
    const newUser = {
      id,
      ...user,
      status: user.status || 'active',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.writeUsers(users);
    return newUser;
  }

  updateUser(id, userData) {
    const users = this.readUsers();
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return null;
    
    if (userData.username && users.some(u => u.id !== parseInt(id) && u.username === userData.username)) {
      throw new Error('用户名已存在');
    }
    
    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    this.writeUsers(users);
    return users[index];
  }

  updateUserPassword(id, newPassword) {
    const users = this.readUsers();
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return false;
    users[index].password = newPassword;
    users[index].updatedAt = new Date().toISOString();
    this.writeUsers(users);
    return true;
  }

  deleteUser(id) {
    const users = this.readUsers();
    if (users.length === 1) {
      throw new Error('不能删除最后一个用户');
    }
    const filtered = users.filter(u => u.id !== parseInt(id));
    if (filtered.length === users.length) return false;
    this.writeUsers(filtered);
    return true;
  }

  readSessions() {
    const data = fs.readFileSync(this.sessionsFile, 'utf-8');
    return JSON.parse(data);
  }

  writeSessions(sessions) {
    fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
  }

  createSession(userId) {
    const sessions = this.readSessions();
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const session = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt
    };
    
    sessions.push(session);
    this.writeSessions(sessions);
    return session;
  }

  getSession(token) {
    const sessions = this.readSessions();
    const session = sessions.find(s => s.token === token);
    if (!session) return null;
    
    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(token);
      return null;
    }
    
    return session;
  }

  deleteSession(token) {
    const sessions = this.readSessions();
    const filtered = sessions.filter(s => s.token !== token);
    this.writeSessions(filtered);
  }

  cleanExpiredSessions() {
    const sessions = this.readSessions();
    const now = new Date();
    const filtered = sessions.filter(s => new Date(s.expiresAt) >= now);
    this.writeSessions(filtered);
  }
}

module.exports = new Database();
