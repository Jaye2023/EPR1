const database = require('../models/database');

class QuoteService {
  getAllQuotes(page = 1, pageSize = 10, search = '', status = '') {
    let quotes = database.readQuotes();
    const customers = database.readCustomers();
    const salespersons = database.readSalespersons();

    if (search) {
      const searchLower = search.toLowerCase();
      quotes = quotes.filter(q =>
        (q.quoteNumber && q.quoteNumber.toLowerCase().includes(searchLower)) ||
        (q.customerName && q.customerName.toLowerCase().includes(searchLower)) ||
        (q.customerId && customers.find(c => c.id === q.customerId)?.name.toLowerCase().includes(searchLower)) ||
        (q.salespersonId && salespersons.find(s => s.id === q.salespersonId)?.name.toLowerCase().includes(searchLower))
      );
    }

    if (status) {
      quotes = quotes.filter(q => q.status === status);
    }

    quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = quotes.length;
    const start = (page - 1) * pageSize;
    const end = start + parseInt(pageSize);
    const paginatedQuotes = quotes.slice(start, end);

    const enrichedQuotes = paginatedQuotes.map(q => {
      const customer = customers.find(c => c.id === q.customerId);
      const salesperson = salespersons.find(s => s.id === q.salespersonId);
      return {
        ...q,
        customer: customer || null,
        salesperson: salesperson || null
      };
    });

    return {
      quotes: enrichedQuotes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  getQuoteById(id) {
    const quotes = database.readQuotes();
    const quote = quotes.find(q => q.id === parseInt(id));
    if (!quote) return null;

    const customers = database.readCustomers();
    const salespersons = database.readSalespersons();
    const quoteItems = database.readQuoteItems().filter(qi => qi.quoteId === parseInt(id));
    
    const customer = customers.find(c => c.id === quote.customerId);
    const salesperson = salespersons.find(s => s.id === quote.salespersonId);

    return {
      ...quote,
      customer: customer || null,
      salesperson: salesperson || null,
      items: quoteItems
    };
  }

  createQuote(quoteData) {
    const quotes = database.readQuotes();
    const newQuote = {
      id: database.generateId('quotes'),
      quoteNumber: database.generateQuoteNumber(),
      ...quoteData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    quotes.push(newQuote);
    database.writeQuotes(quotes);

    if (quoteData.items && Array.isArray(quoteData.items)) {
      const quoteItems = database.readQuoteItems();
      const newItems = quoteData.items.map(item => ({
        id: database.generateId('quoteItems'),
        quoteId: newQuote.id,
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      quoteItems.push(...newItems);
      database.writeQuoteItems(quoteItems);
    }

    return this.getQuoteById(newQuote.id);
  }

  updateQuote(id, quoteData) {
    const quotes = database.readQuotes();
    const index = quotes.findIndex(q => q.id === parseInt(id));
    if (index === -1) return null;

    quotes[index] = {
      ...quotes[index],
      ...quoteData,
      updatedAt: new Date().toISOString()
    };
    database.writeQuotes(quotes);

    if (quoteData.items !== undefined) {
      let quoteItems = database.readQuoteItems();
      quoteItems = quoteItems.filter(qi => qi.quoteId !== parseInt(id));

      if (Array.isArray(quoteData.items)) {
        const newItems = quoteData.items.map(item => ({
          id: item.id || database.generateId('quoteItems'),
          quoteId: parseInt(id),
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        quoteItems.push(...newItems);
      }
      database.writeQuoteItems(quoteItems);
    }

    return this.getQuoteById(id);
  }

  deleteQuote(id) {
    const quotes = database.readQuotes();
    const index = quotes.findIndex(q => q.id === parseInt(id));
    if (index === -1) return false;

    quotes.splice(index, 1);
    database.writeQuotes(quotes);

    let quoteItems = database.readQuoteItems();
    quoteItems = quoteItems.filter(qi => qi.quoteId !== parseInt(id));
    database.writeQuoteItems(quoteItems);

    return true;
  }

  copyQuote(id) {
    const original = this.getQuoteById(id);
    if (!original) return null;

    const { id: originalId, quoteNumber, createdAt, updatedAt, ...quoteData } = original;
    quoteData.quoteNumber = database.generateQuoteNumber();
    quoteData.status = 'draft';

    return this.createQuote(quoteData);
  }

  updateQuoteStatus(id, status) {
    const quotes = database.readQuotes();
    const index = quotes.findIndex(q => q.id === parseInt(id));
    if (index === -1) return null;

    quotes[index].status = status;
    quotes[index].updatedAt = new Date().toISOString();
    database.writeQuotes(quotes);

    return quotes[index];
  }
}

module.exports = new QuoteService();
