const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost', port: 3000, path: path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(json);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3000, path: path, method: 'GET' };
    if (token) opts.headers = { 'Authorization': 'Bearer ' + token };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('=== 测试1: 错误密码登录 ===');
  let r = await post('/api/auth/login', { username: 'admin', password: 'wrong' });
  console.log('Status:', r.status, 'Success:', r.body.success, 'Message:', r.body.message);

  console.log('=== 测试2: admin登录 ===');
  r = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log('Status:', r.status, 'Success:', r.body.success);
  const adminToken = r.body.data ? r.body.data.token : null;
  console.log('Token received:', !!adminToken);
  console.log('User role:', r.body.data ? r.body.data.user.role : 'N/A');

  console.log('=== 测试3: 验证token /api/auth/me ===');
  r = await get('/api/auth/me', adminToken);
  console.log('Status:', r.status, 'Success:', r.body.success, 'Username:', r.body.data ? r.body.data.username : 'N/A');

  console.log('=== 测试4: 获取客户列表 (admin) ===');
  r = await get('/api/customers', adminToken);
  console.log('Status:', r.status, 'Success:', r.body.success, 'Count:', r.body.data ? r.body.data.length : 'N/A');

  console.log('=== 测试5: 无token访问 (应该401) ===');
  try {
    r = await get('/api/customers', null);
    console.log('Status:', r.status, 'Message:', r.body.message);
  } catch (e) {
    console.log('Error (expected):', e.message);
  }

  console.log('=== 测试6: user登录 ===');
  r = await post('/api/auth/login', { username: 'user', password: 'user123' });
  const userToken = r.body.data ? r.body.data.token : null;
  console.log('Status:', r.status, 'Success:', r.body.success);
  console.log('User role:', r.body.data ? r.body.data.user.role : 'N/A');

  console.log('=== 测试7: user获取客户列表 (应该只有1个) ===');
  r = await get('/api/customers', userToken);
  console.log('Status:', r.status, 'Count:', r.body.data ? r.body.data.length : 'N/A');

  console.log('=== 测试8: user获取统计 ===');
  r = await get('/api/stats', userToken);
  console.log('Status:', r.status, 'Success:', r.body.success);
  console.log('TotalValue:', r.body.data ? r.body.data.totalValue : 'N/A');

  console.log('=== 测试9: 注册新用户 ===');
  r = await post('/api/auth/register', { username: 'testuser', password: 'test123', confirmPassword: 'test123', customerName: '测试用户' });
  console.log('Status:', r.status, 'Success:', r.body.success, 'Message:', r.body.message);

  console.log('=== 测试10: 重复注册 ===');
  r = await post('/api/auth/register', { username: 'testuser', password: 'test123', confirmPassword: 'test123' });
  console.log('Status:', r.status, 'Success:', r.body.success, 'Message:', r.body.message);

  console.log('\n=== 所有测试完成 ===');
}

test().catch(console.error);