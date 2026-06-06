# 移动端迁移与全栈升级 - Verification Checklist

---

## Phase 0: 基础设施准备验证

### 环境配置
- [ ] Supabase 项目已创建，数据库可连接
- [ ] Flutter SDK 3.x 已安装，`flutter doctor` 无红色错误
- [ ] Android Studio + Android SDK 已配置，模拟器可正常运行
- [ ] VS Code Flutter/Dart 插件已安装
- [ ] 项目目录已调整为 monorepo 结构（backend/mobile/web）
- [ ] `npm start` 和 `npm test` 在调整后仍正常运行
- [ ] `.env` 文件已创建，包含所有必需的环境变量
- [ ] `JWT_SECRET` 已从硬编码迁移到环境变量
- [ ] `.env` 已在 `.gitignore` 中

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
- [ ] `flutter create` 成功，项目结构正确
- [ ] `pubspec.yaml` 依赖完整，`flutter pub get` 无错误
- [ ] `flutter run` 在模拟器正常启动
- [ ] 目录结构按设计组织（models/database/providers/services/screens/widgets/utils）

### 数据模型
- [ ] 5 个 Dart 数据类定义完整（User/Family/Member/AssetType/Record）
- [ ] `fromJson`/`toJson` 方法正确
- [ ] 模型单元测试通过

### Drift 数据库
- [ ] Drift 表结构定义完整（5 张表 + sync_status 字段）
- [ ] `build_runner` 代码生成成功
- [ ] 数据库初始化成功
- [ ] 基本 CRUD 操作测试通过

### API 服务层
- [ ] `ApiService` 类封装完整
- [ ] JWT Token 自动附加
- [ ] 401 自动登出
- [ ] 统一错误处理
- [ ] 8 个路由模块的 API 方法齐全

### 认证
- [ ] `AuthProvider` 实现完整（登录/登出/自动登录）
- [ ] Token 持久化（SharedPreferences）
- [ ] 应用启动自动检查登录状态
- [ ] AuthProvider 单元测试通过

### 主题与组件
- [ ] 暗色主题配置正确（背景色/主色调/辅助色）
- [ ] 通用组件库完整（AppButton/AppCard/AppTextField/LoadingIndicator/ErrorView/EmptyView/OfflineBanner）
- [ ] 视觉风格与现有 Web 端一致

---

## Phase 3: 核心页面验证

### 登录页面
- [ ] 用户名/密码输入框正常
- [ ] 表单验证（非空校验）生效
- [ ] 登录中 Loading 状态显示
- [ ] 错误提示正确（用户名或密码错误）
- [ ] 登录成功跳转 HomeScreen
- [ ] Token 自动登录功能正常

### 底部导航
- [ ] 三个 Tab（首页/记录/我的）切换流畅
- [ ] `IndexedStack` 保持页面状态
- [ ] 导航栏图标和标签正确

### 仪表盘页面
- [ ] 资产总览卡片数据正确（总资产/成员数/本月新增/待处理）
- [ ] 资产趋势折线图正确渲染
- [ ] 资产配置环形图正确渲染
- [ ] 成员资产柱状图正确渲染
- [ ] 最近记录列表正确展示
- [ ] 下拉刷新功能正常
- [ ] 图表可交互（触摸提示）

### 资产记录列表页
- [ ] 记录列表正确渲染
- [ ] 下拉刷新功能正常
- [ ] 上拉加载更多功能正常
- [ ] 筛选功能正确（成员/类型/状态/日期范围）
- [ ] 搜索功能正确（关键词）
- [ ] 滑动删除 + 确认对话框正常
- [ ] 点击记录跳转编辑页
- [ ] FAB 按钮跳转新增页

### 资产记录新增/编辑页
- [ ] 表单字段完整（类型/名称/价值/日期/备注/成员）
- [ ] 表单验证生效（必填项/价值 >= 0）
- [ ] 资产名称自动补全功能正常
- [ ] 日期选择器正常
- [ ] 编辑模式预填数据正确
- [ ] 提交成功返回列表页
- [ ] 离线模式写入本地 Drift

### 家庭成员管理页
- [ ] 成员卡片列表正确展示
- [ ] 添加成员功能正常
- [ ] 编辑/删除成员功能正常
- [ ] 权限控制正确（仅户主可操作）
- [ ] 删除确认对话框正常

### 资产类型管理页
- [ ] 类型卡片列表正确展示（颜色标识）
- [ ] 添加自定义类型功能正常
- [ ] 恢复默认类型功能正常
- [ ] 权限控制正确（仅户主可操作）

### 个人中心页面
- [ ] 用户信息正确展示
- [ ] 家庭成员列表正确（户主可见）
- [ ] 修改密码功能正常
- [ ] 退出登录功能正常（确认对话框）

---

## Phase 4: 离线同步 + AI 验证

### 同步状态字段
- [ ] Drift 本地表包含 sync_status/local_updated_at/server_updated_at
- [ ] PG 远程表包含对应字段
- [ ] 字段默认值正确

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
- [ ] 同步引擎单元测试通过

### 网络监听
- [ ] 在线/离线状态切换检测正确
- [ ] 在线时自动触发同步
- [ ] 离线时显示 OfflineBanner
- [ ] 同步中显示状态指示器

### 冲突 UI
- [ ] 冲突对话框正确弹出
- [ ] 冲突详情展示清晰
- [ ] 用户选择后数据一致

### AI 报告后端
- [ ] `POST /api/ai/report` 端点正常
- [ ] `POST /api/ai/anomaly` 端点正常
- [ ] `GET /api/ai/task/:taskId` 轮询正常
- [ ] DeepSeek API 调用正常
- [ ] Kimi API 备用切换正常
- [ ] JSON Mode 异常检测输出结构化结果
- [ ] 异步任务队列正常

### AI 缓存与降级
- [ ] 报告缓存 24 小时生效
- [ ] 缓存命中不重复调用 LLM
- [ ] AI 不可用时降级为规则引擎报告
- [ ] 重试机制正确（3 次指数退避）

### 移动端 AI 页面
- [ ] 报告卡片列表正确展示
- [ ] 报告详情页 Markdown 渲染正确
- [ ] "生成新报告"按钮功能正常
- [ ] 加载动画和进度提示正常
- [ ] 异常检测结果展示清晰

---

## Phase 5: 测试与发布验证

### 后端测试
- [ ] `npm test` 全部通过
- [ ] 测试覆盖率 > 80%
- [ ] 所有端点测试覆盖
- [ ] 权限边界测试覆盖
- [ ] 异常情况测试覆盖

### Flutter 单元测试
- [ ] `flutter test` 全部通过
- [ ] Provider 层测试覆盖
- [ ] Service 层测试覆盖
- [ ] Model 层测试覆盖

### Flutter Widget 测试
- [ ] LoginScreen Widget 测试通过
- [ ] DashboardScreen Widget 测试通过
- [ ] RecordsScreen Widget 测试通过
- [ ] RecordFormScreen Widget 测试通过

### 端到端流程
- [ ] 注册/登录流程正常
- [ ] 添加家庭成员流程正常
- [ ] 添加资产记录流程正常
- [ ] 仪表盘数据展示正确
- [ ] 编辑/删除记录流程正常
- [ ] 离线添加 → 恢复在线 → 同步正常
- [ ] AI 报告生成和查看正常
- [ ] 异常检测和查看正常
- [ ] 退出登录 → 重新登录数据持久化正常

### 性能
- [ ] Flutter 帧率 > 60fps
- [ ] 首屏加载 < 2 秒
- [ ] 离线写入 < 500ms
- [ ] 批量同步 < 5 秒（100 条）
- [ ] API P95 响应时间 < 500ms
- [ ] APK 包体积 < 30MB

### 平台适配
- [ ] Android 模拟器无 UI 异常
- [ ] iOS 模拟器无 UI 异常
- [ ] 安全区域适配正确
- [ ] Android 返回键处理正确
- [ ] 权限声明完整
- [ ] 字体缩放适配正确

### 打包发布
- [ ] `flutter build apk --release` 成功
- [ ] `flutter build appbundle --release` 成功
- [ ] Release APK 在真机安装运行正常
- [ ] iOS Archive 成功
- [ ] TestFlight 上传成功

### CI/CD
- [ ] CI 流水线包含 Flutter 环境配置
- [ ] CI 流水线包含 `flutter test`
- [ ] CI 流水线包含 `flutter build`
- [ ] CI 流水线包含 PG 测试数据库配置
- [ ] CI 流水线全部通过

---

## 文档完整性验证
- [ ] PRD 文档（spec.md）完整
- [ ] 实施计划（tasks.md）完整
- [ ] 验证清单（checklist.md）完整
- [ ] 所有文档链接有效
- [ ] 文档表述清晰、无歧义

---

## 变更记录
| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始版本，覆盖 5 个 Phase 验证项 | AI Agent |
