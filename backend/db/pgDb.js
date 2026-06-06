const bcrypt = require('bcryptjs');
const { query } = require('./pgPool');

async function findUserByUsername(username) {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    'SELECT id, username, role, member_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findUserWithMember(userId) {
  const result = await query(
    `SELECT u.*, m.name, m.family_id, m.short_name, m.role as member_role
     FROM users u
     LEFT JOIN members m ON u.member_id = m.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function createUser(username, password, role, memberId) {
  const hash = bcrypt.hashSync(password, 10);
  const result = await query(
    'INSERT INTO users (username, password, role, member_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [username, hash, role, memberId || null]
  );
  return result.rows[0].id;
}

function verifyPassword(inputPassword, storedHash) {
  return bcrypt.compareSync(inputPassword, storedHash);
}

module.exports = {
  findUserByUsername,
  findUserById,
  findUserWithMember,
  createUser,
  verifyPassword,
  query,
};
