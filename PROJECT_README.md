# Ricky Finance - 资产管家项目

## 项目概述
这是一个面向家庭用户的资产管理系统，包含前端页面、后端服务、数据库以及TRAE的智能助手功能。支持户主管理家庭成员，管理员查看所有家庭数据。

## 技术栈
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **前端**: HTML + CSS + JavaScript
- **测试**: Jest + Playwright
- **AI助手**: TRAE Agents/Skills/Tools

## 项目结构
```
Ricky_finance/
├── .trae/              # TRAE配置
│   ├── agents/         # 智能代理
│   ├── skills/         # 技能模块
│   ├── tools/          # 工具
│   ├── mcp/            # MCP服务器
│   └── docs/           # 文档
├── public/             # 前端页面
├── server/             # 后端服务
│   ├── data/           # 数据文件（已包含在Git中）
│   ├── routes/         # API路由
│   ├── middleware/     # 中间件
│   └── services/       # 服务
├── tests/              # 测试文件
└── package.json        # 项目配置
```

## 默认登录账号
- **系统管理员**: admin / admin123
- **户主**: head / head123
- **家庭成员**: member / member123

## 启动项目
```bash
npm install
npm start
```

访问 http://localhost:3000

## 数据说明
- `server/data/users.db` - 用户数据库（包含账户信息）
- `server/data/records.json` - 资产记录数据
- `server/data/customers.json` - 客户数据

**重要**: 这些数据文件已包含在Git仓库中，迁移时会自动保留。

## TRAE功能
项目包含以下AI助手功能：
- 数据分析代理
- 异常检测代理
- 数据同步代理
- 提醒通知代理
- 报告生成代理
- 测试自动化代理
- 图表可视化技能
- 客户管理技能
- 数据录入技能
- 数据导出技能
- 权限管理技能
- 测试运行技能
