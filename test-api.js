const http = require('http');

const API_BASE = 'http://localhost:3000';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 开始测试登录/注册API...\n');

  try {
    // 1. 测试admin登录
    console.log('1️⃣ 测试 admin 账号登录...');
    const loginAdmin = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('   状态码:', loginAdmin.status);
    console.log('   响应:', JSON.stringify(loginAdmin.data, null, 2));
    
    if (loginAdmin.data.success) {
      console.log('   ✅ Admin 登录成功！');
      const token = loginAdmin.data.data.token;
      
      // 2. 测试获取用户信息
      console.log('\n2️⃣ 测试获取当前用户信息...');
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      
      const meResult = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
      });
      
      console.log('   状态码:', meResult.status);
      console.log('   响应:', JSON.stringify(meResult.data, null, 2));
      if (meResult.data.success) {
        console.log('   ✅ 获取用户信息成功！');
      }
    }

    // 3. 测试user登录
    console.log('\n3️⃣ 测试 user 账号登录...');
    const loginUser = await request('POST', '/api/auth/login', {
      username: 'user',
      password: 'user123'
    });
    console.log('   状态码:', loginUser.status);
    console.log('   响应:', JSON.stringify(loginUser.data, null, 2));
    if (loginUser.data.success) {
      console.log('   ✅ User 登录成功！');
    }

    // 4. 测试用户注册
    console.log('\n4️⃣ 测试新用户注册...');
    const newUsername = 'testuser_' + Date.now();
    const register = await request('POST', '/api/auth/register', {
      username: newUsername,
      password: 'test123',
      confirmPassword: 'test123',
      customerName: '测试用户'
    });
    console.log('   用户名:', newUsername);
    console.log('   状态码:', register.status);
    console.log('   响应:', JSON.stringify(register.data, null, 2));
    if (register.data.success) {
      console.log('   ✅ 新用户注册成功！');
    }

    // 5. 测试错误的密码
    console.log('\n5️⃣ 测试错误密码登录...');
    const loginWrong = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'wrongpassword'
    });
    console.log('   状态码:', loginWrong.status);
    console.log('   响应:', JSON.stringify(loginWrong.data, null, 2));
    if (!loginWrong.data.success && loginWrong.status === 401) {
      console.log('   ✅ 错误密码被正确拒绝！');
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testAPI();
