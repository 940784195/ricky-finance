const express = require('express');
const router = express.Router();
const { findUserByUsername, findUserById, createUser, verifyPassword } = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const user = findUserByUsername(username);

  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        customerId: user.customer_id,
        customerName: user.customer_name
      }
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, confirmPassword, customerName } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: '请填写所有必填字段' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: '两次输入的密码不一致' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
  }

  const existingUser = findUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ success: false, message: '该用户名已被注册' });
  }

  const userId = createUser(username, password, 'user', null, customerName || null);

  const user = findUserById(userId);
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        customerId: user.customer_id,
        customerName: user.customer_name
      }
    }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      customerId: user.customer_id,
      customerName: user.customer_name,
      createdAt: user.created_at
    }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

module.exports = router;