const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'spendwise-dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { sign, authRequired };
