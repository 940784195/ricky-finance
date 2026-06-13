# 移动端迁移与全栈升级 - Product Requirement Document

## Overview
- **Summary**: 暂停 Web 端开发，将开发资源集中于 Flutter 移动端研发。后端从 SQLite 迁移至 PostgreSQL（Supabase 托管），新增离线优先数据同步架构与 AI 报告生成功能
- **Purpose**: 以最快速度将产品推向移动端市场，同时为未来规模化运营奠定技术基础
- **Target Users**: 户主（家庭资产管理）、家庭成员（查看/录入资产）、系统管理员（全局管理）

## Goals
- 后端数据库从 SQLite 迁移至 PostgreSQL（Supabase 托管），保持 API 接口兼容
- 使用 Flutter + Provider + Drift 构建跨平台移动端应用（iOS + Android）
- 实现离线优先（Offline-first）数据同步架构，支持无网络环境下正常使用
- 集成 DeepSeek/Kimi 大语言模型，实现资产报告自动生成与异常检测
- 保留现有 Web 端代码作为参考，不删除

## Non-Goals (Out of Scope)
- 不重构现有 Web 端代码（仅保留作为参考）
- 不实现实时协作编辑（多人同时编辑同一资产）
- 不实现推送通知功能（后续版本考虑）
- 不实现第三方登录（微信/Apple ID 等，后续版本考虑）
- 不实现国际化/多语言（仅支持中文）

## Background & Context
- 当前系统为 Node.js + Express + SQLite 后端，纯 HTML/CSS/JS 前端
- 5 张数据表：families、members、asset_types、records、users
- 三种角色体系：admin（管理员）、head（户主）、member（家庭成员）
- 8 个 API 路由模块，JWT 认证，统一响应格式 `{ success, data, message }`
- 项目具备完善的测试体系（Jest + Playwright）和 CI/CD 流水线

## Technical Architecture

### 移动端技术栈
| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 框架 | Flutter 3.x | 跨平台（iOS + Android），个人开发者效率最大化 |
| 状态管理 | Provider | 学习曲线低，Flutter 官方推荐，适合当前项目规模 |
| 本地数据库 | Drift (drift_flutter) | Flutter 生态最成熟 SQLite ORM，类型安全，支持流式查询 |
| 图表 | fl_chart | 支持折线图、饼图、柱状图，完全覆盖现有 Chart.js 功能 |
| HTTP 客户端 | http | Flutter 官方包，轻量级 |
| 网络监听 | connectivity_plus | 检测在线/离线状态 |
| Markdown 渲染 | flutter_markdown | AI 报告展示 |
| 本地存储 | shared_preferences | Token 持久化 |

### 后端技术栈
| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 框架 | Node.js + Express 5 | 复用现有代码，仅替换数据库驱动层 |
| 数据库 | PostgreSQL | 支持并发写入、JSON 字段、丰富索引类型 |
| 托管 | Supabase | 免费层 500MB，免运维，内置 Auth 可选 |
| 数据库驱动 | pg (node-postgres) | Node.js 最成熟的 PG 驱动 |
| LLM 调用 | axios | HTTP 客户端，调用 DeepSeek/Kimi API |
| 环境变量 | dotenv | 密钥管理 |

### 数据同步架构
- **模式**: 离线优先（Offline-first）
- **同步状态**: `synced` / `pending_create` / `pending_update` / `pending_delete`
- **冲突策略**: 
  - 资产记录（records）：最后写入者胜出（LWW）
  - 成员信息（members）：合并策略
  - 资产类型（asset_types）：最后写入者胜出（LWW）
- **上传机制**: 批量事务上传，失败全部回滚
- **时间戳**: 云端时间戳（`server_updated_at`）解决冲突

## Functional Requirements

### FR-1: 后端数据库迁移
- 将 5 张表从 SQLite DDL 转换为 PostgreSQL DDL
- 所有 API 端点保持接口兼容（请求/响应格式不变）
- 认证中间件从同步 SQLite 查询改为异步 PG 查询
- 种子数据迁移至 PG 语法

### FR-2: 用户认证（移动端）
- 用户名 + 密码登录
- JWT Token 持久化存储（SharedPreferences）
- 自动登录（Token 有效期内）
- 401 自动登出并跳转登录页
- 三种角色权限隔离（admin/head/member）

### FR-2.1: 登录错误提示系统
- **认证失败提示**：用户名或密码错误时，显示具体错误信息并提供默认用户提示
- **用户不存在提示**：输入不存在的用户名时，提示用户检查用户名并列出系统现有用户
- **网络连接失败提示**：无法连接到服务器时，提供详细的网络检查步骤
- **连接超时提示**：服务器响应超时时，提供重试建议和网络检查指导
- **服务器错误提示**：服务器内部错误时，提示稍后重试并建议联系管理员
- **服务不可用提示**：服务维护时，显示维护状态信息
- **统一错误对话框**：使用图标+标题+详细描述的对话框形式，提升用户体验
- **默认用户信息**：在认证失败时显示系统默认用户账号信息（admin/admin123等）

### FR-3: 仪表盘页面（移动端）
- 资产总览卡片：总资产、成员数、本月新增、待处理记录数
- 资产趋势折线图（fl_chart LineChart）
- 资产配置环形图（fl_chart PieChart）
- 成员资产柱状图（fl_chart BarChart）
- 最近资产记录列表

### FR-4: 资产记录管理（移动端）
- 记录列表（下拉刷新、上拉加载更多）
- 多条件筛选：成员、资产类型、状态、日期范围
- 关键词搜索（资产名称）
- 新增/编辑资产记录（表单验证）
- 滑动删除记录
- 资产名称自动补全

### FR-5: 家庭成员管理（移动端）
- 成员卡片列表展示
- 添加成员（姓名、角色）
- 编辑/删除成员（仅户主权限）

### FR-6: 资产类型管理（移动端）
- 类型卡片列表（颜色标识）
- 添加自定义类型（仅户主）
- 恢复默认类型（仅户主）

### FR-7: 离线数据同步
- 所有 CRUD 操作优先写入本地 Drift 数据库
- 在线时自动同步待推送数据
- 离线时显示离线提示条
- 冲突检测与用户选择（保留本地/服务端版本）
- 首次启动全量拉取数据

### FR-8: AI 报告生成
- 后端 API 调用 DeepSeek（主）/ Kimi（备）生成资产分析报告
- 异步任务模式（提交 → 返回 taskId → 轮询结果）
- 报告缓存 24 小时
- AI 不可用时降级为规则引擎统计报告
- 移动端 Markdown 渲染报告内容

### FR-9: AI 异常检测
- 分析资产变动数据，识别异常波动
- JSON Mode 输出结构化检测结果
- 移动端展示异常告警列表

## Non-Functional Requirements
- **NFR-1**: 移动端页面首屏加载 < 2 秒
- **NFR-2**: 离线写入操作响应 < 500ms
- **NFR-3**: 数据同步单次批量上传 < 5 秒（100 条记录以内）
- **NFR-4**: AI 报告生成 < 15 秒（含 LLM 响应时间）
- **NFR-5**: 移动端 APK 包体积 < 30MB
- **NFR-6**: 后端 API 响应时间 < 500ms（P95）
- **NFR-7**: 支持至少 1000 个家庭用户并发（Supabase 免费层上限）

## Constraints
- **Technical**: 
  - Flutter 3.x 稳定版
  - Express 5.x（当前已使用）
  - PostgreSQL 15+（Supabase 默认版本）
  - 个人开发者独立完成全部开发工作
- **Business**: 
  - 月运营成本 < ¥50（Supabase 免费层 + DeepSeek API）
  - 优先移动端，Web 端暂停开发但保留代码
- **Dependencies**: 
  - Supabase 服务可用性
  - DeepSeek/Kimi API 可用性
  - Flutter 生态包版本兼容性

## Assumptions
- 个人开发者具备 Node.js/Express 开发经验（已验证）
- 个人开发者需要学习 Flutter/Dart（已预留学习时间）
- 现有 Web 端代码结构清晰，可作为移动端功能参考
- Supabase 免费层在初期运营阶段足够使用
- 目标用户主要使用 Android 设备（国内市场现状）

## Acceptance Criteria

### AC-1: 后端 PG 迁移完成
- **Given**: 后端服务已部署到 Supabase
- **When**: 运行全部 API 测试套件
- **Then**: 所有测试用例通过，API 响应格式与迁移前一致
- **Verification**: `programmatic` (Jest + supertest)

### AC-2: 移动端登录功能
- **Given**: 用户已注册账号
- **When**: 输入正确的用户名和密码并提交
- **Then**: 成功登录并跳转至仪表盘页面，Token 持久化存储
- **Verification**: `programmatic` (Widget test) + `human-judgment`

### AC-3: 移动端仪表盘
- **Given**: 用户已登录且有资产数据
- **When**: 打开仪表盘页面
- **Then**: 正确展示总资产、趋势图、配置图、成员柱状图、最近记录
- **Verification**: `human-judgment`

### AC-4: 移动端资产记录 CRUD
- **Given**: 用户已登录
- **When**: 执行新增/编辑/删除资产记录操作
- **Then**: 操作成功，列表实时更新，数据与服务端一致
- **Verification**: `programmatic` (Widget test) + `human-judgment`

### AC-5: 离线数据同步
- **Given**: 用户处于离线状态
- **When**: 新增一条资产记录后恢复网络
- **Then**: 记录自动同步到服务端，本地和服务端数据一致
- **Verification**: `programmatic` (Unit test) + `human-judgment`

### AC-6: AI 报告生成
- **Given**: 用户有足够的资产数据
- **When**: 请求生成 AI 分析报告
- **Then**: 返回结构化的资产分析报告，包含趋势分析和建议
- **Verification**: `human-judgment`

### AC-7: AI 异常检测
- **Given**: 资产数据存在异常波动
- **When**: 请求异常检测
- **Then**: 返回结构化的异常检测结果，标识异常资产和波动幅度
- **Verification**: `human-judgment`

### AC-8: 移动端打包发布
- **Given**: 所有功能开发完成并通过测试
- **When**: 执行 Flutter build 命令
- **Then**: 成功生成 Android APK/AAB 和 iOS IPA
- **Verification**: `programmatic` (flutter build)

## Open Questions
- [ ] 是否需要保留 Web 端的 PWA 支持作为移动端补充？
- [ ] 后续是否需要支持微信小程序？
- [ ] 是否需要集成 Supabase Auth 替代自建 JWT 认证？
- [ ] AI 报告是否需要支持导出为 PDF？
- [ ] 是否需要添加数据备份/恢复功能？

## Change Log
| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始版本，定义移动端迁移全栈升级方案 | AI Agent |
