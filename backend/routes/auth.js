const express = require('express');
const { findUserByUsername, verifyPassword, findUserWithMember } = require('../db/pgDb');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const valid = verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const userWithMember = await findUserWithMember(user.id);
  const token = generateToken(userWithMember);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: userWithMember.role,
      name: userWithMember.name || user.username,
      memberId: userWithMember.member_id,
      familyId: userWithMember.family_id,
      shortName: userWithMember.short_name
    }
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

module.exports = router;
