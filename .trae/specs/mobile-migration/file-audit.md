# 项目文件审计与整理方案 — 移动端迁移准备

> **审计日期**: 2026-06-06  
> **审计范围**: `d:\TRAEworkspace\Ricky_finance_repository\Ricky_finance` 全部文件（76 个）  
> **目标**: 为方案 A（渐进式迁移）清理无用文件、归档 Web 前端、标记需修改的后端文件  
> **原则**: 所有操作可追溯、可回滚，确保后续 APP 开发不受影响

---

## 一、文件分类标准

| 分类 | 标识 | 定义 | 操作 |
|------|------|------|------|
| **KEEP_MODIFY** | 🔧 | 后端核心文件，需为 PG 迁移做修改 | 保留并修改 |
| **KEEP_REFERENCE** | 📖 | Web 前端文件，作为 Flutter 开发的功能/设计参考 | 移至 `_archive/web/` |
| **KEEP_ASIS** | ✅ | 配置、文档、规格文件，无需修改 | 保留不动 |
| **NEEDS_UPDATE** | 📝 | 内容需更新以反映新架构 | 保留并更新 |
| **DELETE** | 🗑️ | 临时文件、调试输出、无价值文件 | 删除 |
| **ARCHIVE** | 📦 | 已完成的旧规格、不再维护的模块 | 移至 `_archive/` |

---

## 二、逐文件审计与分类

### 2.1 根目录文件 (9 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 1 | `package.json` | 🔧 KEEP_MODIFY | 后端核心配置。需添加 `pg`、`dotenv`、`axios` 依赖；更新 scripts 路径指向 `backend/` | 修改 |
| 2 | `package-lock.json` | 🔧 KEEP_MODIFY | 随 package.json 自动更新 | 自动更新 |
| 3 | `.gitignore` | 📝 NEEDS_UPDATE | 需添加 `.env`、Flutter 构建产物（`build/`、`.dart_tool/`）、`_archive/` 说明 | 更新 |
| 4 | `jest.config.js` | 🔧 KEEP_MODIFY | 测试配置。需更新 `roots` 指向 `backend/`，调整 `testMatch` 路径 | 修改 |
| 5 | `playwright.config.js` | 📦 ARCHIVE | E2E 测试针对 Web 前端。Web 暂停开发后不再需要，但保留以备将来恢复 | 移至 `_archive/` |
| 6 | `PROJECT_README.md` | 📝 NEEDS_UPDATE | 项目说明需更新：新架构说明、Flutter 移动端入口、Supabase 部署信息 | 更新 |
| 7 | `SEED_DATA_GUIDE.md` | 📝 NEEDS_UPDATE | 种子数据方案需更新为 PG 版本 | 更新 |
| 8 | `test_output.txt` | 🗑️ DELETE | 临时测试输出日志，无长期价值 | 删除 |
| 9 | `temp_analysis.xlsx` | 🗑️ DELETE | 临时分析文件 | 删除 |
| 10 | `temp_analyze.ps1` | 🗑️ DELETE | 临时 PowerShell 脚本 | 删除 |
| 11 | `temp_analyze2.ps1` | 🗑️ DELETE | 临时 PowerShell 脚本 | 删除 |
| 12 | `temp_analyze3.ps1` | 🗑️ DELETE | 临时 PowerShell 脚本 | 删除 |
| 13 | `temp_sheets.ps1` | 🗑️ DELETE | 临时 PowerShell 脚本 | 删除 |

---

### 2.2 public/ 前端文件 (9 个)

> **整体判断**: Web 前端已暂停开发，全部归档作为 Flutter 开发的参考。不删除，因为：
> 1. 包含完整的功能逻辑，是 Flutter 页面开发的最佳参考
> 2. 包含 UI 配色、布局、交互模式，可指导 Flutter UI 设计
> 3. 未来可能恢复 Web 端或做 PWA 版本

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 14 | `public/css/common.css` | 📖 KEEP_REFERENCE | 暗色主题配色方案（CSS 变量）、组件样式规范。Flutter 主题定义的核心参考 | 移至 `_archive/web/public/css/` |
| 15 | `public/js/api.js` | 📖 KEEP_REFERENCE | API 接口定义和调用模式。Flutter `ApiService` 的核心参考 | 移至 `_archive/web/public/js/` |
| 16 | `public/js/utils.js` | 📖 KEEP_REFERENCE | 格式化函数（货币、日期）、Toast 通知逻辑。Flutter 工具类的参考 | 移至 `_archive/web/public/js/` |
| 17 | `public/index.html` | 📖 KEEP_REFERENCE | 入口重定向，无实质内容 | 移至 `_archive/web/public/` |
| 18 | `public/login.html` | 📖 KEEP_REFERENCE | 登录页面 UI 和流程。Flutter LoginScreen 的参考 | 移至 `_archive/web/public/` |
| 19 | `public/dashboard.html` | 📖 KEEP_REFERENCE | **最重要参考**：仪表盘布局、图表配置、数据去重算法、趋势计算逻辑 | 移至 `_archive/web/public/` |
| 20 | `public/records.html` | 📖 KEEP_REFERENCE | 记录管理页面：筛选逻辑、时间线视图、自动补全、导出功能 | 移至 `_archive/web/public/` |
| 21 | `public/members.html` | 📖 KEEP_REFERENCE | 成员管理页面 UI 和权限控制 | 移至 `_archive/web/public/` |
| 22 | `public/asset-types.html` | 📖 KEEP_REFERENCE | 资产类型管理：颜色选择器、恢复默认逻辑 | 移至 `_archive/web/public/` |
| 23 | `public/admin-families.html` | 📖 KEEP_REFERENCE | 管理员家庭查看页面 | 移至 `_archive/web/public/` |

---

### 2.3 server/ 后端文件 (10 个)

> **整体判断**: 后端代码是移动端 API 的基础，全部保留但需要为 PG 迁移做修改。

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 24 | `server/index.js` | 🔧 KEEP_MODIFY | Express 入口。路由挂载逻辑不变，需更新数据库初始化方式（从 `getDb()` 到 PG pool） | 保留，移至 `backend/index.js`，修改 |
| 25 | `server/db.js` | 🔧 KEEP_MODIFY | **核心修改文件**。SQLite 驱动需替换为 PG。保留 `initTables`/`initIndexes`/`seedDefaultData` 逻辑，改写为 PG 语法。用户辅助函数改为异步 | 保留，移至 `backend/db/pgPool.js` + `backend/db/migrate.js` + `backend/db/seed.js`，重写 |
| 26 | `server/middleware/auth.js` | 🔧 KEEP_MODIFY | JWT 认证中间件。`findUserWithMember` 需改为异步 PG 查询。JWT_SECRET 从硬编码迁移到环境变量 | 保留，移至 `backend/middleware/auth.js`，修改 |
| 27 | `server/routes/auth.js` | 🔧 KEEP_MODIFY | 登录路由。`findUserByUsername` 改为异步，其余逻辑不变 | 保留，移至 `backend/routes/auth.js`，修改 |
| 28 | `server/routes/records.js` | 🔧 KEEP_MODIFY | 资产记录 CRUD。所有 `db.prepare().all()` 改为 `await pool.query()`，参数占位符 `?` → `$1` | 保留，移至 `backend/routes/records.js`，修改 |
| 29 | `server/routes/members.js` | 🔧 KEEP_MODIFY | 成员管理路由。同上异步改造 | 保留，移至 `backend/routes/members.js`，修改 |
| 30 | `server/routes/asset-types.js` | 🔧 KEEP_MODIFY | 资产类型路由。同上异步改造 | 保留，移至 `backend/routes/asset-types.js`，修改 |
| 31 | `server/routes/families.js` | 🔧 KEEP_MODIFY | 家庭管理路由。同上异步改造 | 保留，移至 `backend/routes/families.js`，修改 |
| 32 | `server/routes/stats.js` | 🔧 KEEP_MODIFY | 统计路由。聚合查询需适配 PG 语法（日期函数、COUNT DISTINCT） | 保留，移至 `backend/routes/stats.js`，修改 |
| 33 | `server/routes/customers.js` | 🔧 KEEP_MODIFY | 客户管理路由。同上异步改造 | 保留，移至 `backend/routes/customers.js`，修改 |
| 34 | `server/routes/export.js` | 🔧 KEEP_MODIFY | 导出路由。同上异步改造 | 保留，移至 `backend/routes/export.js`，修改 |

---

### 2.4 tests/ 测试文件 (4 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 35 | `tests/helpers/setup.js` | 🔧 KEEP_MODIFY | 测试辅助。需从 SQLite 切换到 PG 测试数据库，`resetToSeedData` 改为 PG 版本 | 保留，修改 |
| 36 | `tests/e2e/customers.spec.js` | 📦 ARCHIVE | Web E2E 测试，Web 暂停后不再运行 | 移至 `_archive/tests/e2e/` |
| 37 | `tests/e2e/overview.spec.js` | 📦 ARCHIVE | Web E2E 测试 | 移至 `_archive/tests/e2e/` |
| 38 | `tests/e2e/records.spec.js` | 📦 ARCHIVE | Web E2E 测试 | 移至 `_archive/tests/e2e/` |

---

### 2.5 .github/ CI/CD (1 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 39 | `.github/workflows/ci-cd.yml` | 📝 NEEDS_UPDATE | CI/CD 流水线需更新：添加 Flutter 构建步骤、PG 测试数据库配置、移除 Playwright E2E 步骤 | 更新 |

---

### 2.6 .trae/ 配置 (40 个文件)

#### 2.6.1 .trae/ 根目录

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 40 | `.trae/.ignore` | ✅ KEEP_ASIS | TRAE 忽略配置 | 保留 |

#### 2.6.2 .trae/agents/ (6 个)

> **整体判断**: Agent 配置描述的是功能愿景，与具体实现无关。全部保留，部分描述与新架构高度吻合。

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 41 | `agents/anomaly-detection-agent/AGENT.md` | ✅ KEEP_ASIS | 异常检测 — 与 AI 异常检测功能（FR-9）直接对应 | 保留 |
| 42 | `agents/data-analysis-agent/AGENT.md` | ✅ KEEP_ASIS | 数据分析 — 与仪表盘（FR-3）和 AI 报告（FR-8）对应 | 保留 |
| 43 | `agents/data-sync-agent/AGENT.md` | ✅ KEEP_ASIS | 数据同步 — 与离线同步架构（FR-7）直接对应 | 保留 |
| 44 | `agents/reminder-notification-agent/AGENT.md` | ✅ KEEP_ASIS | 提醒通知 — 后续版本功能 | 保留 |
| 45 | `agents/report-generator-agent/AGENT.md` | ✅ KEEP_ASIS | 报表生成 — 与 AI 报告生成（FR-8）对应 | 保留 |
| 46 | `agents/test-automation-agent/AGENT.md` | ✅ KEEP_ASIS | 测试自动化 — 持续有效 | 保留 |

#### 2.6.3 .trae/skills/ (6 个技能 + 2 个模板)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 47 | `skills/chart-visualization/SKILL.md` | ✅ KEEP_ASIS | 图表可视化 — Flutter 端使用 fl_chart 实现 | 保留 |
| 48 | `skills/customer-management/SKILL.md` | ✅ KEEP_ASIS | 客户管理 — 后端 customers 路由保留 | 保留 |
| 49 | `skills/data-entry/SKILL.md` | ✅ KEEP_ASIS | 数据录入 — 移动端核心功能 | 保留 |
| 50 | `skills/data-export/SKILL.md` | 📝 NEEDS_UPDATE | 数据导出 — 引用了 Web 端 `public/js/excel-export.js` 和 `server/services/excel-service.js`（不存在），需更新为移动端导出方案 | 更新 |
| 51 | `skills/data-export/templates/2_资产分配记录表202601-202612.xlsx` | 📖 KEEP_REFERENCE | Excel 模板参考 | 移至 `_archive/templates/` |
| 52 | `skills/data-export/templates/analyze_excel.ps1` | 🗑️ DELETE | 临时分析脚本 | 删除 |
| 53 | `skills/permission-management/SKILL.md` | ✅ KEEP_ASIS | 权限管理 — 三角色体系保持不变 | 保留 |
| 54 | `skills/test-runner/SKILL.md` | 📝 NEEDS_UPDATE | 测试运行 — 需更新为包含 Flutter 测试命令 | 更新 |

#### 2.6.4 .trae/mcp/ (4 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 55 | `mcp/cross-platform-sync-mcp/MCP.md` | ✅ KEEP_ASIS | 跨平台同步 — 与离线同步架构对应 | 保留 |
| 56 | `mcp/data-encryption-mcp/MCP.md` | ✅ KEEP_ASIS | 数据加密 — 安全需求持续有效 | 保留 |
| 57 | `mcp/data-storage-mcp/MCP.md` | ✅ KEEP_ASIS | 数据存储 — 已覆盖 PG 支持 | 保留 |
| 58 | `mcp/notification-push-mcp/MCP.md` | ✅ KEEP_ASIS | 通知推送 — 后续版本功能 | 保留 |

#### 2.6.5 .trae/tools/ (1 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 59 | `tools/translation-assistant/TOOL.md` | ✅ KEEP_ASIS | 翻译工具 | 保留 |

#### 2.6.6 .trae/docs/ (14 个)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 60 | `docs/requirements/需求文档.md` | ✅ KEEP_ASIS | 需求文档索引 | 保留 |
| 61 | `docs/requirements/01_用户认证与权限管理.md` | ✅ KEEP_ASIS | 认证需求 — 移动端同样适用 | 保留 |
| 62 | `docs/requirements/02_家庭与成员管理.md` | ✅ KEEP_ASIS | 家庭/成员需求 | 保留 |
| 63 | `docs/requirements/03_资产记录与类型管理.md` | ✅ KEEP_ASIS | 资产记录需求 | 保留 |
| 64 | `docs/requirements/04_资产概览与数据分析.md` | ✅ KEEP_ASIS | 数据分析需求 | 保留 |
| 65 | `docs/requirements/05_报表导出与系统设置.md` | ✅ KEEP_ASIS | 导出需求 | 保留 |
| 66 | `docs/requirements/06_AI辅助功能需求.md` | ✅ KEEP_ASIS | AI 需求 — 与 FR-8/FR-9 对应 | 保留 |
| 67 | `docs/requirements/07_界面与公共组件设计.md` | 📖 KEEP_REFERENCE | 界面设计 — Web 端设计规范，Flutter UI 参考 | 保留（作为参考） |
| 68 | `docs/requirements/08_技术与附录需求.md` | 📝 NEEDS_UPDATE | 技术附录 — 需更新技术栈信息（Flutter/PG/Supabase） | 更新 |
| 69 | `docs/requirements/ui-design-guide.md` | 📖 KEEP_REFERENCE | UI 设计指南 — 色彩系统、组件规范，Flutter 主题定义的核心参考 | 保留（作为参考） |
| 70 | `docs/02_design/02_数据库设计规范.md` | 📝 NEEDS_UPDATE | 数据库设计 — 需更新为 PG 语法，添加 sync_status 字段 | 更新 |
| 71 | `docs/02_design/05_数据流转设计.md` | 📝 NEEDS_UPDATE | 数据流转 — 需添加离线同步数据流 | 更新 |
| 72 | `docs/02_design/06_待开发清单与验证Checklist.md` | 📝 NEEDS_UPDATE | 待开发清单 — 需更新为移动端迁移任务 | 更新 |
| 73 | `docs/02_design/10_测试数据与验收映射.md` | 📝 NEEDS_UPDATE | 测试数据 — 需更新为 PG 种子数据 | 更新 |

#### 2.6.7 .trae/specs/ (9 个文件，3 个目录)

| # | 文件 | 分类 | 理由 | 操作 |
|---|------|------|------|------|
| 74 | `specs/asset-record-refinement/spec.md` | 📦 ARCHIVE | 已完成规格，Web 端优化相关 | 移至 `_archive/specs/asset-record-refinement/` |
| 75 | `specs/asset-record-refinement/tasks.md` | 📦 ARCHIVE | 已完成任务 | 移至 `_archive/specs/asset-record-refinement/` |
| 76 | `specs/asset-record-refinement/checklist.md` | 📦 ARCHIVE | 已完成验证 | 移至 `_archive/specs/asset-record-refinement/` |
| 77 | `specs/mobile-migration/spec.md` | ✅ KEEP_ASIS | **当前活跃规格** — 移动端迁移 PRD | 保留 |
| 78 | `specs/mobile-migration/tasks.md` | ✅ KEEP_ASIS | **当前活跃任务** — 实施计划 | 保留 |
| 79 | `specs/mobile-migration/checklist.md` | ✅ KEEP_ASIS | **当前活跃验证** — 验证清单 | 保留 |
| 80 | `specs/ui-design-integration/spec.md` | 📦 ARCHIVE | 已完成规格，Web UI 整合 | 移至 `_archive/specs/ui-design-integration/` |
| 81 | `specs/ui-design-integration/tasks.md` | 📦 ARCHIVE | 已完成任务 | 移至 `_archive/specs/ui-design-integration/` |
| 82 | `specs/ui-design-integration/checklist.md` | 📦 ARCHIVE | 已完成验证 | 移至 `_archive/specs/ui-design-integration/` |

---

## 三、统计汇总

| 分类 | 数量 | 占比 |
|------|------|------|
| 🔧 KEEP_MODIFY（保留并修改） | 17 | 20.7% |
| 📖 KEEP_REFERENCE（归档参考） | 13 | 15.9% |
| ✅ KEEP_ASIS（保留不动） | 30 | 36.6% |
| 📝 NEEDS_UPDATE（保留并更新） | 11 | 13.4% |
| 🗑️ DELETE（删除） | 8 | 9.8% |
| 📦 ARCHIVE（归档） | 8 | 9.8% |
| **总计** | **82** | **100%** |

---

## 四、目标目录结构

执行整理后的项目结构：

```
Ricky_finance/
├── backend/                          # 🔧 后端代码（从 server/ 迁移）
│   ├── index.js                      # Express 入口
│   ├── db/
│   │   ├── pgPool.js                 # PG 连接池（新建）
│   │   ├── migrate.js                # 迁移脚本（新建）
│   │   └── seed.js                   # 种子数据（新建）
│   ├── middleware/
│   │   └── auth.js                   # JWT 认证中间件
│   └── routes/
│       ├── auth.js
│       ├── records.js
│       ├── members.js
│       ├── asset-types.js
│       ├── families.js
│       ├── stats.js
│       ├── customers.js
│       ├── export.js
│       └── ai.js                     # AI 路由（新建，Phase 4）
│
├── mobile/                           # 🆕 Flutter 移动端（Phase 2 创建）
│   └── ricky_finance_mobile/
│
├── tests/                            # 🔧 测试代码
│   ├── helpers/
│   │   └── setup.js                  # PG 测试辅助
│   └── api/                          # API 单元测试
│
├── _archive/                         # 📦 归档目录
│   ├── web/                          # Web 前端归档
│   │   └── public/
│   │       ├── css/common.css
│   │       ├── js/api.js
│   │       ├── js/utils.js
│   │       ├── login.html
│   │       ├── dashboard.html
│   │       ├── records.html
│   │       ├── members.html
│   │       ├── asset-types.html
│   │       └── admin-families.html
│   ├── tests/
│   │   └── e2e/                      # Playwright E2E 测试归档
│   ├── specs/
│   │   ├── asset-record-refinement/  # 已完成规格归档
│   │   └── ui-design-integration/    # 已完成规格归档
│   ├── templates/                    # Excel 模板归档
│   └── playwright.config.js          # Playwright 配置归档
│
├── .trae/                            # ✅ TRAE 配置（保留）
│   ├── agents/                       # 6 个智能代理
│   ├── skills/                       # 6 个技能模块
│   ├── mcp/                          # 4 个 MCP 服务器
│   ├── tools/                        # 1 个工具
│   ├── docs/                         # 需求与设计文档
│   └── specs/
│       └── mobile-migration/         # 当前活跃规格
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 # 📝 待更新
│
├── .env.example                      # 🆕 环境变量模板（新建）
├── .gitignore                        # 📝 待更新
├── package.json                      # 🔧 待修改
├── package-lock.json                 # 🔧 自动更新
├── jest.config.js                    # 🔧 待修改
├── PROJECT_README.md                 # 📝 待更新
└── SEED_DATA_GUIDE.md                # 📝 待更新
```

---

## 五、执行计划

### 5.1 执行前准备（安全保障）

1. **Git 提交当前状态**
   ```bash
   git add -A
   git commit -m "chore: 移动端迁移前的完整快照"
   git tag pre-migration-snapshot
   ```

2. **创建备份分支**
   ```bash
   git checkout -b backup/pre-migration-full
   git checkout main  # 或当前分支
   ```

### 5.2 执行步骤（按顺序）

| 步骤 | 操作 | 涉及文件数 | 风险等级 |
|------|------|-----------|---------|
| **Step 1** | 删除临时文件（🗑️） | 8 | 🟢 低 |
| **Step 2** | 创建 `_archive/` 目录结构 | — | 🟢 低 |
| **Step 3** | 移动归档文件（📦 + 📖） | 21 | 🟢 低 |
| **Step 4** | 创建 `backend/` 目录，移动后端文件 | 11 | 🟡 中 |
| **Step 5** | 更新配置文件（🔧 + 📝） | 12 | 🟡 中 |
| **Step 6** | 验证 `npm start` 和 `npm test` | — | 🔴 高 |
| **Step 7** | Git 提交整理结果 | — | 🟢 低 |

### 5.3 回滚方案

如任一步骤出现问题：
```bash
# 回滚到整理前的状态
git checkout pre-migration-snapshot -- .

# 或完全重置
git reset --hard pre-migration-snapshot
```

---

## 六、需修改文件详细清单

### 6.1 🔧 KEEP_MODIFY — 后端文件（17 个）

| 文件 | 修改内容 | 影响范围 | 关联任务 |
|------|---------|---------|----------|
| `package.json` | 添加 `pg`、`dotenv`、`axios` 依赖；scripts 路径更新 | 依赖安装 | P1-1 |
| `jest.config.js` | roots 改为 `backend/`；testMatch 路径更新 | 测试运行 | P1-10 |
| `server/index.js` → `backend/index.js` | 数据库初始化改为 PG pool；添加 `dotenv/config` | 应用启动 | P1-3 |
| `server/db.js` → `backend/db/pgPool.js` | 完全重写为 PG 连接池模块 | 所有路由 | P1-3 |
| `server/db.js` → `backend/db/migrate.js` | 提取建表逻辑为独立迁移脚本 | 数据库初始化 | P1-2 |
| `server/db.js` → `backend/db/seed.js` | 提取种子数据为独立脚本 | 测试/部署 | P1-9 |
| `server/middleware/auth.js` | `findUserWithMember` 改为异步；JWT_SECRET 从 env 读取 | 认证流程 | P1-8 |
| `server/routes/auth.js` | `findUserByUsername` 改为异步 | 登录流程 | P1-4 |
| `server/routes/records.js` | 所有查询改为 `pool.query()`；`?` → `$1` | 记录 CRUD | P1-5 |
| `server/routes/members.js` | 同上异步改造 | 成员管理 | P1-7 |
| `server/routes/asset-types.js` | 同上异步改造 | 类型管理 | P1-7 |
| `server/routes/families.js` | 同上异步改造 | 家庭管理 | P1-7 |
| `server/routes/stats.js` | 聚合查询适配 PG 语法 | 统计数据 | P1-6 |
| `server/routes/customers.js` | 同上异步改造 | 客户管理 | P1-7 |
| `server/routes/export.js` | 同上异步改造 | 数据导出 | P1-7 |
| `tests/helpers/setup.js` | 从 SQLite 切换到 PG 测试数据库 | 测试环境 | P1-10 |

### 6.2 📝 NEEDS_UPDATE — 文档/配置（11 个）

| 文件 | 更新内容 | 关联任务 |
|------|---------|----------|
| `.gitignore` | 添加 `.env`、Flutter 构建产物、`_archive/` 说明 | P0-4 |
| `PROJECT_README.md` | 新架构说明、Flutter 入口、Supabase 部署 | P1-11 |
| `SEED_DATA_GUIDE.md` | PG 种子数据方案 | P1-9 |
| `.github/workflows/ci-cd.yml` | Flutter 构建步骤、PG 测试配置 | P5-8 |
| `skills/data-export/SKILL.md` | 移除 Web 端引用，更新为移动端方案 | — |
| `skills/test-runner/SKILL.md` | 添加 Flutter 测试命令 | — |
| `docs/requirements/08_技术与附录需求.md` | 更新技术栈信息 | — |
| `docs/02_design/02_数据库设计规范.md` | PG 语法、sync_status 字段 | P1-2 |
| `docs/02_design/05_数据流转设计.md` | 离线同步数据流 | P4-3 |
| `docs/02_design/06_待开发清单与验证Checklist.md` | 移动端迁移任务 | — |
| `docs/02_design/10_测试数据与验收映射.md` | PG 种子数据 | P1-9 |

---

## 七、风险提示

| 风险 | 应对 |
|------|------|
| 移动 `server/` → `backend/` 后 `require` 路径失效 | Step 4 执行后立即运行 `npm test` 验证 |
| 删除临时文件后发现仍有引用 | 先搜索引用再删除（`grep` 检查） |
| 归档 Web 文件后需要参考时找不到 | `_archive/` 目录保留在仓库中，随时可查阅 |
| `.gitignore` 更新后误忽略重要文件 | 更新后 `git status` 检查是否有意外忽略 |

---

## 八、变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始审计报告，覆盖全部 82 个文件 | AI Agent |
