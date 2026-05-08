const database = require('../models/database');

class ProductService {
  parseDescription(description) {
    const result = {
      plugModel: null,
      wireSpec: null,
      length: null,
      tailProcessings: [],
      color: null,
      conductor: null
    };

    if (!description) return result;

    this._parsePlugModel(description, result);
    this._parseWireSpec(description, result);
    this._parseLength(description, result);
    this._parseTailProcessings(description, result);
    this._parseColor(description, result);
    this._parseConductor(description, result);

    return result;
  }

  _parsePlugModel(description, result) {
    const plugPatterns = [
      /ML-\d{3}(?:\([^)]+\))?/,
      /[A-Z]{2,}-\d{3,4}(?:\([^)]+\))?/,
      /[A-Z]{2,}\d{3,4}(?:\([^)]+\))?/,
      /[A-Z]+\d+[A-Z]*(?:\([^)]+\))?/,
      /\b[A-Z]{1,2}\d{2,4}(?:-[A-Z0-9]+)?(?:\([^)]+\))?\b/
    ];

    for (const pattern of plugPatterns) {
      const plugMatch = description.match(pattern);
      if (plugMatch) {
        result.plugModel = plugMatch[0].trim();
        return;
      }
    }
  }

  _parseWireSpec(description, result) {
    const wirePatterns = [
      /(H0[35][A-Z]+-[A-Z]+\s*\d+\s*[Xx*]\s*\d+\.?\d*)/i,
      /(H0[35][A-Z]+-[A-Z]\s*\d+\s*[Xx*]\s*\d+\.?\d*)/i,
      /(HPN\s+\d+\/\d+C)/i,
      /([A-Z]+\s*\d+AWG[Xx\/][23]C)/i,
      /([A-Z]+\s+\d+[\/Xx]\d+C)/i,
      /([A-Z]+\s*-?\s*[A-Z]+\s*\d+\s*[Xx*]\s*\d+\.?\d*)/i,
      /([A-Z]{2,}[-\s]?[A-Z]+\s*\d+\s*[Xx*]\s*\d+\.?\d*)/i
    ];

    for (const pattern of wirePatterns) {
      const wireMatch = description.match(pattern);
      if (wireMatch) {
        let wireSpecStr = wireMatch[1].replace(/\s+/g, ' ').trim();
        wireSpecStr = wireSpecStr.replace(/([\d])\s*[Xx]\s*([\d])/gi, '$1*$2');
        
        if (wireSpecStr.includes('AWG')) {
          wireSpecStr = wireSpecStr.replace(/AWG/i, ' AWG ').replace(/X/gi, '/').trim();
        }
        
        result.wireSpec = wireSpecStr;
        return;
      }
    }
  }

  _parseLength(description, result) {
    const lengthPatterns = [
      /总长\s*[=:]\s*([\d.]+)\s*米/i,
      /长度\s*[=:]\s*([\d.]+)\s*米/i,
      /长\s*[=:]\s*([\d.]+)\s*米/i,
      /([\d.]+)\s*米/i,
      /L=([\d.]+)/i,
      /Length[:=]\s*([\d.]+)/i,
      /总长\s*([\d.]+)\s*m/i
    ];

    for (const pattern of lengthPatterns) {
      const lengthMatch = description.match(pattern);
      if (lengthMatch) {
        const length = parseFloat(lengthMatch[1]);
        if (length > 0) {
          result.length = length;
          return;
        }
      }
    }
  }

  _parseTailProcessings(description, result) {
    const tailProcessingKeywords = {
      '尾部脱皮半剥': /尾部脱皮半剥|脱皮半剥/,
      '尾部全剥': /尾部全剥|全剥/,
      '尾部沾锡': /尾部沾锡|沾锡/,
      '尾部压端子': /尾部压端子|压端子/,
      '尾部热缩管': /尾部热缩管|热缩管/,
      '尾部打端子护套': /尾部打端子护套|端子护套/,
      '尾部扎线': /尾部扎线|扎线/,
      '尾部连接线': /尾部连接线|连接线/
    };

    for (const [name, pattern] of Object.entries(tailProcessingKeywords)) {
      if (pattern.test(description)) {
        if (!result.tailProcessings.includes(name)) {
          result.tailProcessings.push(name);
        }
      }
    }
  }

  _parseColor(description, result) {
    const colorPattern = /(黑色|白色|红色|蓝色|绿色|黄色|灰色|透明|棕色|紫色|橙色|粉色)/;
    const colorMatch = description.match(colorPattern);
    if (colorMatch) {
      result.color = colorMatch[1];
    }
  }

  _parseConductor(description, result) {
    const conductorPattern = /(普通导体|镀锡导体|无氧铜|铜导体|铜包铝|镀银)/;
    const conductorMatch = description.match(conductorPattern);
    if (conductorMatch) {
      result.conductor = conductorMatch[1];
    }
  }

  calculatePrice(parsedData) {
    let totalPrice = 0;
    const breakdown = {
      plugPrice: 0,
      wirePrice: 0,
      tailProcessingPrice: 0,
      length: parsedData.length || 0
    };

    if (parsedData.plugModel) {
      const plug = database.findPlugByName(parsedData.plugModel);
      
      if (plug) {
        breakdown.plugPrice = plug.price;
        totalPrice += plug.price;
      }
    }

    if (parsedData.wireSpec && parsedData.length) {
      const wirePriceResult = database.calculateWirePrice(parsedData.wireSpec);
      
      if (wirePriceResult) {
        breakdown.wirePrice = wirePriceResult.finalPrice * parsedData.length;
        totalPrice += breakdown.wirePrice;
      } else {
        const wireSpecs = database.readWireSpecs();
        let foundWire = this.matchWireSpec(parsedData.wireSpec, wireSpecs);
        if (foundWire) {
          const wireUnitPrice = foundWire.copper || 0;
          breakdown.wirePrice = wireUnitPrice * parsedData.length;
          totalPrice += breakdown.wirePrice;
        }
      }
    }

    if (parsedData.tailProcessings.length > 0) {
      const tailProcessings = database.readTailProcessings();
      for (const processing of parsedData.tailProcessings) {
        const tp = tailProcessings.find(t => t.name === processing);
        if (tp) {
          breakdown.tailProcessingPrice += tp.price;
          totalPrice += tp.price;
        }
      }
    }

    return {
      totalPrice: Math.round(totalPrice * 100) / 100,
      breakdown
    };
  }

  matchWireSpec(inputSpec, wireSpecs) {
    const normalizedInput = inputSpec.toLowerCase().replace(/\s+/g, '');
    
    const matchPatterns = [
      (spec) => spec.toLowerCase().replace(/\s+/g, '') === normalizedInput,
      (spec) => spec.toLowerCase().replace(/\s+/g, '').includes(normalizedInput),
      (spec) => normalizedInput.includes(spec.toLowerCase().replace(/\s+/g, '')),
      (spec) => {
        const specNoSpace = spec.toLowerCase().replace(/\s+/g, '');
        const inputNoSpace = normalizedInput;
        return specNoSpace.replace(/[x*]/g, '') === inputNoSpace.replace(/[x*]/g, '');
      },
      (spec) => {
        const specParts = spec.toLowerCase().split(/[\s*/xX]+/).filter(p => p);
        const inputParts = inputSpec.toLowerCase().split(/[\s*/xX]+/).filter(p => p);
        return specParts.length === inputParts.length && 
               specParts.every((part, index) => inputParts[index] === part);
      }
    ];

    for (const pattern of matchPatterns) {
      const found = wireSpecs.find(w => pattern(w.spec));
      if (found) {
        console.log(`Wire spec matched: input="${inputSpec}", found="${found.spec}", pattern=${matchPatterns.indexOf(pattern) + 1}`);
        return found;
      }
    }

    console.log(`No wire spec matched for: "${inputSpec}"`);
    return null;
  }

  autoCalculateProductPrice(productId) {
    const products = database.readProducts();
    const index = products.findIndex(p => p.id === parseInt(productId));
    if (index === -1) return null;

    const product = products[index];
    const parsedData = this.parseDescription(product.description);
    const calculation = this.calculatePrice(parsedData);

    const updatedProduct = {
      ...product,
      ...parsedData,
      unitPrice: calculation.totalPrice,
      plugPrice: calculation.breakdown.plugPrice,
      cablePrice: calculation.breakdown.wirePrice,
      wirePrice: calculation.breakdown.wirePrice,
      tailProcessing: parsedData.tailProcessings.join(';'),
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    database.writeProducts(products);
    return updatedProduct;
  }

  autoCalculateAllProducts() {
    const products = database.readProducts();
    let updatedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const parsedData = this.parseDescription(products[i].description);
      const calculation = this.calculatePrice(parsedData);

      if (calculation.totalPrice > 0) {
        products[i] = {
          ...products[i],
          ...parsedData,
          unitPrice: calculation.totalPrice,
          plugPrice: calculation.breakdown.plugPrice,
          cablePrice: calculation.breakdown.wirePrice,
          wirePrice: calculation.breakdown.wirePrice,
          tailProcessing: parsedData.tailProcessings.join(';'),
          updatedAt: new Date().toISOString()
        };
        updatedCount++;
      }
    }

    database.writeProducts(products);
    return { updatedCount, totalCount: products.length };
  }
  getAllProducts(page = 1, pageSize = 10, search = '') {
    let products = database.readProducts();
    const processCards = database.readProcessCards();
    const customerItemNumbers = database.readCustomerItemNumbers();
    const customers = database.readCustomers();

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p =>
        (p.item && p.item.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    const total = products.length;
    const start = (page - 1) * pageSize;
    const end = start + parseInt(pageSize);
    const paginatedProducts = products.slice(start, end);

    const productsWithRelations = paginatedProducts.map(product => {
      const processCard = processCards.find(pc => pc.productId === product.id);
      const customerItemNumber = customerItemNumbers.find(cin => cin.productId === product.id);
      
      return {
        ...product,
        processCardInfo: processCard ? {
          id: processCard.id,
          code: processCard.code,
          name: processCard.name,
          description: processCard.description
        } : null,
        customerItemNumberInfo: customerItemNumber ? {
          id: customerItemNumber.id,
          itemNumber: customerItemNumber.itemNumber,
          description: customerItemNumber.description,
          customerId: customerItemNumber.customerId,
          customerName: customers.find(c => c.id === customerItemNumber.customerId)?.name || null
        } : null
      };
    });

    return {
      products: productsWithRelations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  getProductById(id) {
    const products = database.readProducts();
    const processCards = database.readProcessCards();
    const customerItemNumbers = database.readCustomerItemNumbers();
    const customers = database.readCustomers();
    
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) return null;

    const processCard = processCards.find(pc => pc.productId === product.id);
    const customerItemNumber = customerItemNumbers.find(cin => cin.productId === product.id);

    return {
      ...product,
      processCardInfo: processCard ? {
        id: processCard.id,
        code: processCard.code,
        name: processCard.name,
        description: processCard.description
      } : null,
      customerItemNumberInfo: customerItemNumber ? {
        id: customerItemNumber.id,
        itemNumber: customerItemNumber.itemNumber,
        description: customerItemNumber.description,
        customerId: customerItemNumber.customerId,
        customerName: customers.find(c => c.id === customerItemNumber.customerId)?.name || null
      } : null
    };
  }

  createProduct(productData) {
    const products = database.readProducts();
    const newProduct = {
      id: database.generateId('products'),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    database.writeProducts(products);
    return newProduct;
  }

  updateProduct(id, productData) {
    const products = database.readProducts();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    database.writeProducts(products);
    return products[index];
  }

  deleteProduct(id) {
    const products = database.readProducts();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index === -1) return false;

    products.splice(index, 1);
    database.writeProducts(products);
    return true;
  }

  importProducts(productsData) {
    const products = database.readProducts();
    const newProducts = productsData.map(p => ({
      id: database.generateId('products'),
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    products.push(...newProducts);
    database.writeProducts(products);
    return newProducts;
  }
}

module.exports = new ProductService();
