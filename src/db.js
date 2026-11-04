/**
 * In-memory database.
 *
 * All data lives in plain JavaScript variables and is reset every time the
 * server restarts. Seed data: 3 users and 3 products.
 */
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', passwordHash: hashPassword('alice123') },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', passwordHash: hashPassword('bob123') },
  { id: 3, name: 'Carol White', email: 'carol@example.com', passwordHash: hashPassword('carol123') },
];

const products = [
  { id: 1, name: 'Wireless Mouse', price: 25.0, stock: 100 },
  { id: 2, name: 'Mechanical Keyboard', price: 80.0, stock: 50 },
  { id: 3, name: 'USB-C Monitor 27"', price: 300.0, stock: 20 },
];

// token -> userId
const sessions = new Map();

// userId -> [{ productId, quantity }]
const carts = new Map();

const orders = [];

let nextUserId = users.length + 1;
let nextOrderId = 1;

module.exports = {
  users,
  products,
  sessions,
  carts,
  orders,
  hashPassword,
  newUserId: () => nextUserId++,
  newOrderId: () => nextOrderId++,
};
