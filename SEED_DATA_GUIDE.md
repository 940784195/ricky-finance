# 种子数据方案说明

## 方案概述

我们实现了真正的**独立测试数据库 + 每次测试运行前重新加载种子数据**的方案。

## 核心功能

### 1. 独立测试数据库
- 使用单独的 `test.db` 数据库文件，与生产数据库完全分离
- 位于 `server/data/test.db`
- 通过 `setActiveDb(TEST_DB_NAME)` 自动切换

### 2. 每次测试前完全重置
- 每次测试前通过 `resetToSeedData()` 函数完全重新创建数据库
- 包括：
  - 删除旧的 `test.db` 文件
  - 重新创建空的数据库
  - 重新创建所有表结构
  - 插入完整的种子数据
  - 重新生成测试 Token

## 使用方法

### 在测试文件中

```javascript
const request = require('supertest');
const app = require('../server/index');
const { resetToSeedData, adminToken, headToken } = require('./helpers/setup');

// 每次测试前重置到种子状态
beforeEach(() => {
  resetToSeedData();
});

describe('您的测试', () => {
  it('应该能正常工作', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});
```

## 种子数据包含的内容

### 家庭和成员
- **测试家庭**：
  - 测试户主（head）
  - 测试成员1（member）
  - 测试成员2（member）
- **测试家庭B**：
  - 户主B
  - 成员B1

### 资产类型
- 预设类型：stock, fund, bond, realestate, cash, other
- 自定义类型：crypto（加密货币）, gold（黄金）

### 资产记录
- 正常状态的各类资产
- 多状态记录（pending, archived）
- 同一资产多次记录（测试更新规则）
- 边界条件数据（极小值、极高值）
- 多家庭隔离测试数据

## 技术实现

### 主要函数

| 函数 | 功能 |
|-----|------|
| `resetToSeedData()` | **推荐使用**：每次测试前重置到种子状态 |
| `initTestDb()` | 完整重建测试数据库和种子数据 |
| `seedTestDbData(db)` | 插入完整的种子数据到数据库 |
| `initTokens()` | 重新生成测试用的 JWT Token |
| `getTestData()` | 获取测试辅助数据（家庭 ID、成员 ID 等） |

### 向后兼容

保留了以下函数，但会输出警告：
- `seedTestData()`：实际调用 `resetToSeedData()`
- `cleanupTestData()`：空函数，因为不再需要手动清理

## 优势

1. **测试隔离**：每个测试都从完全干净的状态开始
2. **数据一致性**：不会因为之前的测试影响后续测试
3. **调试友好**：测试失败时数据库处于可预测的状态
4. **外键约束安全**：完整重建避免了外键问题

## 与之前方案的对比

### 之前的方案
- 只在模块加载时初始化一次
- 每次测试前只清理 records 表
- 保留其他表数据
- 容易出现外键约束问题
- 数据状态不可预测

### 现在的方案
- 每次测试前完整重建数据库
- 删除旧的数据库文件
- 重新创建所有表和数据
- 外键约束完全安全
- 数据状态完全可预测
