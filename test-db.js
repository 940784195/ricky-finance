const { getDb, findUserByUsername, verifyPassword } = require('./server/db');

console.log('正在测试数据库初始化...\n');

try {
  const db = getDb();
  console.log('✓ 数据库连接成功\n');

  // 检查用户
  const users = db.prepare('SELECT * FROM users').all();
  console.log(`找到 ${users.length} 个用户:`);
  users.forEach(u => {
    console.log(`  - ${u.username} (${u.role})`);
  });

  console.log('\n测试密码验证:');
  
  // 测试admin
  const adminUser = findUserByUsername('admin');
  if (adminUser) {
    const validAdmin = verifyPassword('admin123', adminUser.password);
    console.log(`  admin: ${validAdmin ? '✓ 密码正确' : '✗ 密码错误'}`);
  }

  // 测试head
  const headUser = findUserByUsername('head');
  if (headUser) {
    const validHead = verifyPassword('head123', headUser.password);
    console.log(`  head: ${validHead ? '✓ 密码正确' : '✗ 密码错误'}`);
  }

  // 测试member
  const memberUser = findUserByUsername('member');
  if (memberUser) {
    const validMember = verifyPassword('member123', memberUser.password);
    console.log(`  member: ${validMember ? '✓ 密码正确' : '✗ 密码错误'}`);
  }

  console.log('\n检查家庭成员:');
  const members = db.prepare('SELECT * FROM members').all();
  console.log(`找到 ${members.length} 个成员:`);
  members.forEach(m => {
    console.log(`  - ${m.name} (${m.role})`);
  });

  console.log('\n✓ 数据库测试完成！');

} catch (err) {
  console.error('✗ 数据库测试失败:', err);
}