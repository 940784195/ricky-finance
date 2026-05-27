const jwt = require('jsonwebtoken');
const { findUserWithMember } = require('../db');

const JWT_SECRET = 'ricky_finance_jwt_secret_2024';
const JWT_EXPIRES_IN = '24h';

function generateToken(user) {
  const memberInfo = user.member_id ? {
    memberId: user.member_id,
    name: user.name,
    familyId: user.family_id,
    shortName: user.short_name,
    memberRole: user.member_role
  } : null;

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      ...memberInfo
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserWithMember(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = findUserWithMember(decoded.id);
      if (user) {
        req.user = decoded;
      }
    } catch (err) {
    }
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
}

module.exports = { generateToken, authMiddleware, optionalAuth, requireRole, JWT_SECRET };
