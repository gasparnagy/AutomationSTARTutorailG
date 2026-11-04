const express = require('express');
const db = require('./db');
const { createToken, requireAuth } = require('./auth');

const router = express.Router();

const CASH_DISCOUNT_RATE = 0.1; // 10% discount when paying with cash
const PAYMENT_METHODS = ['cash', 'credit_card'];

const round2 = (n) => Math.round(n * 100) / 100;
const publicUser = ({ passwordHash, ...user }) => user;
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

function buildCart(userId) {
  const items = (db.carts.get(userId) || []).map(({ productId, quantity }) => {
    const product = db.products.find((p) => p.id === productId);
    return {
      productId,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: round2(product.price * quantity),
    };
  });
  const total = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
  return { items, total };
}

// POST /api/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const user = {
    id: db.newUserId(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: db.hashPassword(password),
  };
  db.users.push(user);
  res.status(201).json(publicUser(user));
});

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== db.hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: createToken(user.id), user: publicUser(user) });
});

// GET /api/cart
router.get('/cart', requireAuth, (req, res) => {
  res.json(buildCart(req.user.id));
});

// POST /api/cart  -> add a product to the cart (or increase its quantity)
router.post('/cart', requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'productId and quantity must be positive integers' });
  }
  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: `Product ${productId} not found` });
  }

  const cart = db.carts.get(req.user.id) || [];
  const existing = cart.find((i) => i.productId === productId);
  const newQuantity = (existing ? existing.quantity : 0) + quantity;
  if (newQuantity > product.stock) {
    return res.status(400).json({ error: `Not enough stock for "${product.name}" (available: ${product.stock})` });
  }

  if (existing) existing.quantity = newQuantity;
  else cart.push({ productId, quantity });
  db.carts.set(req.user.id, cart);

  res.status(201).json(buildCart(req.user.id));
});

// POST /api/checkout
router.post('/checkout', requireAuth, (req, res) => {
  const { paymentMethod } = req.body || {};
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}` });
  }

  const cart = buildCart(req.user.id);
  if (cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  for (const item of cart.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (item.quantity > product.stock) {
      return res.status(400).json({ error: `Not enough stock for "${product.name}" (available: ${product.stock})` });
    }
  }

  // Business rule: cash -> 10% discount, credit card -> no discount
  const subtotal = cart.total;
  const discount = paymentMethod === 'cash' ? round2(subtotal * CASH_DISCOUNT_RATE) : 0;
  const total = round2(subtotal - discount);

  for (const item of cart.items) {
    db.products.find((p) => p.id === item.productId).stock -= item.quantity;
  }
  db.carts.delete(req.user.id);

  const order = {
    orderId: db.newOrderId(),
    userId: req.user.id,
    items: cart.items,
    paymentMethod,
    subtotal,
    discount,
    total,
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);

  res.status(201).json(order);
});

module.exports = router;
