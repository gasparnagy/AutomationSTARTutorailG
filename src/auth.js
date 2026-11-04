const crypto = require('crypto');
const db = require('./db');

function createToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions.set(token, userId);
  return token;
}

/** Express middleware: requires "Authorization: Bearer <token>". */
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  const userId = scheme === 'Bearer' && token ? db.sessions.get(token) : undefined;
  const user = userId && db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(401).json({ error: 'Missing or invalid authentication token' });
  }
  req.user = user;
  next();
}

module.exports = { createToken, requireAuth };
