require('./config.js').initDatabase();
const api = require('./api.js');

const quote = api.getQuoteById(2);
console.log('Full quote data:');
console.log(JSON.stringify(quote, null, 2));

console.log('\n--- Checking customer object ---');
console.log('Has customer:', quote && quote.customer !== undefined);
if (quote && quote.customer) {
  console.log('Customer:', JSON.stringify(quote.customer, null, 2));
}

console.log('\n--- Checking salesperson object ---');
console.log('Has salesperson:', quote && quote.salesperson !== undefined);
if (quote && quote.salesperson) {
  console.log('Salesperson:', JSON.stringify(quote.salesperson, null, 2));
}