const http = require('http');

function testPage(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: body.substring(0, 200) + '...' });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 测试页面访问...\n');

  try {
    console.log('1️⃣ 测试 /login.html');
    const loginResult = await testPage('/login.html');
    console.log('   状态码:', loginResult.status);
    console.log('   Content-Type:', loginResult.headers['content-type']);
    console.log('   内容预览:', loginResult.body);
    if (loginResult.status === 200) {
      console.log('   ✅ 登录页面访问成功！');
    }

    console.log('\n2️⃣ 测试 /asset-records.html');
    const assetsResult = await testPage('/asset-records.html');
    console.log('   状态码:', assetsResult.status);
    console.log('   Content-Type:', assetsResult.headers['content-type']);
    console.log('   内容预览:', assetsResult.body);
    if (assetsResult.status === 200) {
      console.log('   ✅ 资产记录页面访问成功！');
    }

    console.log('\n3️⃣ 测试 /index.html');
    const indexResult = await testPage('/index.html');
    console.log('   状态码:', indexResult.status);
    console.log('   Content-Type:', indexResult.headers['content-type']);
    console.log('   内容预览:', indexResult.body);
    if (indexResult.status === 200) {
      console.log('   ✅ 首页访问成功！');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();
