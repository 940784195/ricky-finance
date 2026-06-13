# 移动端迁移与全栈升级 - Verification Checklist

> 版本: v1.1 | 更新日期: 2026-06-06

---

## Phase 0: 基础设施准备验证

### 环境配置
- [x] Node.js v24.16.0 已安装，路径 `C:\Program Files\nodejs\`
- [x] Git v2.54.0 已安装，路径 `C:\Program Files\Git\`
- [x] PowerShell 7.6.2 已安装，路径 `D:\dev\pwsh\`
- [x] JDK 17.0.19 (Eclipse Adoptium) 已安装，路径 `D:\dev\jdk-17\`
- [x] Flutter SDK 3.29.3 已安装，路径 `D:\dev\flutter\`
- [x] Dart SDK 已随 Flutter 自动下载
- [x] Flutter 国内镜像已配置（PUB_HOSTED_URL / FLUTTER_STORAGE_BASE_URL）
- [x] Visual Studio Community 2019 已安装（Windows 桌面开发可用）
- [x] Chrome 可用（Web 开发）
- [x] `flutter doctor` Flutter 行绿色勾 ✅
- [x] Android Studio + Android SDK 已配置，模拟器可正常运行 ✅
- [x] Supabase 项目已创建，数据库可连接 ✅（IP 直连，99 测试通过）
- [ ] VS Code Flutter/Dart 插件已安装
- [x] `.env` 文件已创建，包含所有必需的环境变量 ✅
- [ ] `JWT_SECRET` 已从硬编码迁移到环境变量
- [ ] `.env` 已在 `.gitignore` 中

### 环境搭建踩坑记录（已解决）
- [x] PowerShell 7 缺失 → 解压便携版到 `D:\dev\pwsh` 并添加 PATH
- [x] 系统 PATH 被覆盖丢失 `C:\Windows\System32` → 手动恢复
- [x] Git 仅在系统 PATH 中，Flutter 无法识别 → 添加到用户 PATH
- [x] pub.dev 网络超时 → 配置 Flutter 国内镜像
- [x] Flutter 缓存损坏（flutter_tools.snapshot 缺失）→ 删除 cache 重建
- [x] NDK 版本不匹配 → 安装 NDK 27.0.12077973，匹配 build.gradle.kts
- [x] CMake 版本冲突（ninja 失败）→ 移除显式 CMake 版本配置，使用 SDK 内置 3.22.1
- [x] Gradle 仓库配置冲突 → settings.gradle.kts 改为 PREFER_SETTINGS 模式
- [x] Gradle 下载超时 → 等待重试后成功
- [x] `Type 'Color' not found` → formatters.dart 添加 flutter/material.dart 导入
- [x] Android 模拟器启动 → Pixel 6 API 34，应用成功安装运行
- [x] Supabase DNS 解析失败 → 使用 IP 地址 `43.202.154.182` 直连成功

---

## Phase 1: 后端 PG 迁移验证

### 数据库迁移
- [ ] PG 建表迁移脚本无语法错误，可在 Supabase SQL Editor 执行
- [ ] 5 张表正确创建，外键约束生效
- [ ] 索引正确创建（6 个索引）
- [ ] `sync_status`、`local_updated_at`、`server_updated_at` 字段已添加
- [ ] 种子数据脚本可正常执行，数据完整

### 路由适配
- [ ] `auth.js` 路由适配完成，登录/登出正常
- [ ] `records.js` 路由适配完成，CRUD 全部正常
- [ ] `stats.js` 路由适配完成，统计数据正确
- [ ] `members.js` 路由适配完成
- [ ] `families.js` 路由适配完成
- [ ] `asset-types.js` 路由适配完成
- [ ] `export.js` 路由适配完成
- [ ] `customers.js` 路由适配完成

### 认证中间件
- [ ] `authMiddleware` 已改为异步函数
- [ ] 有效 token 请求正常通过认证
- [ ] 无效/过期 token 返回 401
- [ ] 角色权限检查正确（admin/head/member 数据隔离）

### 测试
- [ ] `npm test` 全部通过（Jest 单元测试）
- [ ] API 响应格式与迁移前一致（`{ success, data, message }`）
- [ ] 手动测试关键 API（登录、获取记录、获取统计）均正常

---

## Phase 2: Flutter 基础搭建验证

### 项目初始化
- [x] `pubspec.yaml` 依赖完整
- [x] 目录结构按设计组织（models/database/providers/services/screens/widgets/utils）
- [x] `flutter pub get` 无错误
- [x] `flutter run` 在模拟器正常启动 ✅

### 数据模型
- [x] 5 个 Dart 数据类定义完整（User/Family/Member/AssetType/Record）
- [x] `fromJson`/`toJson` 方法正确

### Drift 数据库
- [x] Drift 表结构定义完整（5 张表 + sync_status 字段）
- [x] `build_runner` 代码生成成功
- [x] 数据库初始化成功

### API 服务层
- [x] `ApiService` 类封装完整
- [x] JWT Token 自动附加
- [x] 401 自动登出
- [x] 统一错误处理

### 认证
- [x] `AuthProvider` 实现完整（登录/登出/自动登录）
- [x] Token 持久化（SharedPreferences）
- [x] 应用启动自动检查登录状态

### 主题与组件
- [x] 暗色主题配置正确（背景色/主色调/辅助色）
- [x] 通用组件库完整（StatCard/LoadingView/ErrorView/EmptyView）

---

## Phase 3: 核心页面验证

### 登录页面
- [x] 用户名/密码输入框正常
- [x] 表单验证（非空校验）生效
- [x] 登录中 Loading 状态显示
- [x] 错误提示正确（用户名或密码错误）
- [x] 登录成功跳转 HomeScreen
- [x] Token 自动登录功能正常

### 底部导航
- [x] 三个 Tab（首页/记录/我的）切换流畅
- [x] `IndexedStack` 保持页面状态
- [x] 导航栏图标和标签正确

### 仪表盘页面
- [x] 资产总览卡片数据正确（总资产/成员数/本月新增/待处理）
- [x] 资产趋势折线图正确渲染
- [x] 资产配置环形图正确渲染
- [x] 最近记录列表正确展示
- [x] 下拉刷新功能正常

### 资产记录列表页
- [x] 记录列表正确渲染
- [x] 下拉刷新功能正常
- [x] 筛选功能正确（成员/类型/状态）
- [x] 搜索功能正确（关键词）
- [x] FAB 按钮跳转新增页

### 资产记录新增/编辑页
- [x] 表单字段完整（类型/名称/价值/日期/备注/成员）
- [x] 表单验证生效（必填项/价值 >= 0）
- [x] 资产名称自动补全功能正常
- [x] 日期选择器正常
- [x] 编辑模式预填数据正确

### 家庭成员管理页
- [x] 成员卡片列表正确展示
- [x] 添加成员功能正常
- [x] 编辑/删除成员功能正常
- [x] 权限控制正确（仅户主可操作）
- [x] 删除确认对话框正常

### 资产类型管理页
- [x] 类型卡片列表正确展示（颜色标识）
- [x] 添加自定义类型功能正常
- [x] 恢复默认类型功能正常
- [x] 权限控制正确（仅户主可操作）

### 个人中心页面
- [x] 用户信息正确展示
- [x] 家庭成员入口（跳转 MembersScreen）
- [x] 资产类型入口（跳转 AssetTypesScreen）
- [x] 退出登录功能正常（确认对话框）

---

## Phase 4: 离线同步 + AI 验证

### 同步状态字段
- [x] Drift 本地表包含 sync_status/local_updated_at/server_updated_at
- [ ] PG 远程表包含对应字段
- [x] 字段默认值正确

### 离线写入
- [ ] 离线状态下 CRUD 操作写入本地 Drift
- [ ] sync_status 标记正确（pending_create/pending_update/pending_delete）
- [ ] 在线时自动触发同步

### 同步引擎
- [ ] 拉取（pullFromServer）功能正常
- [ ] 推送（pushToServer）功能正常
- [ ] 批量上传事务性正确（失败回滚）
- [ ] 冲突检测逻辑正确
- [ ] LWW 冲突策略正确（records/asset_types）
- [ ] 合并策略正确（members）

### 网络监听
- [ ] 在线/离线状态切换检测正确
- [ ] 在线时自动触发同步
- [ ] 离线时显示 OfflineBanner

### 冲突 UI
- [ ] 冲突对话框正确弹出
- [ ] 用户选择后数据一致

### AI 报告后端
- [ ] `POST /api/ai/report` 端点正常
- [ ] `POST /api/ai/anomaly` 端点正常
- [ ] DeepSeek API 调用正常
- [ ] Kimi API 备用切换正常
- [ ] AI 不可用时降级为规则引擎报告

### 移动端 AI 页面
- [ ] 报告卡片列表正确展示
- [ ] 报告详情页 Markdown 渲染正确
- [ ] "生成新报告"按钮功能正常

---

## Phase 5: 测试与发布验证

### 后端测试
- [ ] `npm test` 全部通过
- [ ] 测试覆盖率 > 80%
- [ ] 所有端点测试覆盖

### Flutter 单元测试
- [ ] `flutter test` 全部通过
- [ ] Provider 层测试覆盖
- [ ] Service 层测试覆盖

### Flutter Widget 测试
- [ ] LoginScreen Widget 测试通过
- [ ] DashboardScreen Widget 测试通过
- [ ] RecordsScreen Widget 测试通过

### 端到端流程
- [ ] 注册/登录流程正常
- [ ] 添加家庭成员流程正常
- [ ] 添加资产记录流程正常
- [ ] 仪表盘数据展示正确
- [ ] 离线添加 → 恢复在线 → 同步正常
- [ ] AI 报告生成和查看正常
- [ ] 退出登录 → 重新登录数据持久化正常

### 性能
- [ ] Flutter 帧率 > 60fps
- [ ] 首屏加载 < 2 秒
- [ ] APK 包体积 < 30MB

### 平台适配
- [ ] Android 模拟器无 UI 异常
- [ ] 安全区域适配正确
- [ ] Android 返回键处理正确

### 打包发布
- [ ] `flutter build apk --release` 成功
- [ ] `flutter build appbundle --release` 成功
- [ ] Release APK 在真机安装运行正常

### CI/CD
- [ ] CI 流水线包含 Flutter 环境配置
- [ ] CI 流水线包含 `flutter test`
- [ ] CI 流水线包含 `flutter build`

---

## 文档完整性验证
- [x] PRD 文档（spec.md）完整
- [x] 实施计划（tasks.md）完整
- [x] 验证清单（checklist.md）完整
- [x] 待办任务清单（pending-tasks.md）完整
- [x] 开发环境配置指南（dev-environment-setup.md）完整
- [x] 文件审计报告（file-audit.md）完整

---

## 变更记录
| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始版本，覆盖 5 个 Phase 验证项 | AI Agent |
| 2026-06-06 | v1.1 | 更新 Phase 0 环境配置实际状态，标记已完成项 | AI Agent |
| 2026-06-11 | v1.2 | 标记 Android Studio/模拟器/NDK/CMake 配置完成；标记 flutter pub get/build_runner/flutter run 完成；新增踩坑记录（NDK/CMake/Gradle/Color） | AI Agent |
