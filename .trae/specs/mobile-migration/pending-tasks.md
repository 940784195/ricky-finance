# 项目待办任务清单

> 生成日期: 2026-06-06 | 基于 Phase 0 ~ Phase 5 完整任务分解

---

## 一、任务状态总览

| Phase | 名称 | 总任务数 | 已完成 | 进行中 | 待开始 | 完成率 |
|-------|------|---------|--------|--------|--------|--------|
| Phase 0 | 基础设施准备 | 4 | 2 | 1 | 1 | 50% |
| Phase 1 | 后端迁移 PostgreSQL | 11 | 11 | 0 | 0 | **100%** |
| Phase 2 | Flutter 移动端基础搭建 | 7 | 7 | 0 | 0 | **100%** |
| Phase 3 | 核心页面开发 | 8 | 8 | 0 | 0 | **100%** |
| Phase 4 | 离线同步 + AI 功能 | 8 | 0 | 0 | 8 | 0% |
| Phase 5 | 测试、优化与发布 | 8 | 0 | 0 | 8 | 0% |
| **合计** | | **46** | **28** | **1** | **17** | **60.9%** |

---

## 二、当前阶段待办任务（按优先级排序）

### 🔴 高优先级（阻塞后续开发）

| 序号 | 任务编号 | 任务名称 | 优先级 | 依赖 | 负责人 | 状态 |
|------|---------|---------|--------|------|--------|------|
| 1 | P0-1 | Supabase 项目创建与配置 | 🔴 P0 | 无 | 用户手动 | ⬜ 待开始 |
| 2 | P0-2 | Flutter 开发环境搭建 | 🔴 P0 | 无 | 用户手动 | 🔄 进行中 |

#### P0-1: Supabase 项目创建与配置

**当前状态**: 阻塞 — 本地无 Docker、无 psql、无 .env 文件

**实施步骤**:
1. 访问 https://supabase.com 注册账号
2. 创建新项目，选择 Asia Pacific (Southeast Asia) 区域
3. 进入 Project Settings → Database → Connection string
4. 复制 Host、Port、Database、User、Password
5. 在项目根目录创建 `.env` 文件（参考 `.env.example`）
6. 填入连接信息后，运行 `node backend/db/migrate.js` 执行建表
7. 运行 `node backend/db/seed.js` 初始化种子数据
8. 运行 `npm test` 验证后端 API 全部通过

**验收标准**: `npm test` 全部通过，API 响应正常

---

#### P0-2: Flutter 开发环境搭建

**当前状态**: 进行中 — Flutter SDK 已解压到 `D:\dev\flutter`，PowerShell 7 待安装

**已完成**:
- [x] Flutter SDK 3.29.3 下载并解压到 `D:\dev\flutter`
- [x] `D:\dev\flutter\bin` 已添加到系统 PATH

**待完成**:
- [ ] 安装 PowerShell 7（ZIP 已下载: `D:\Users\94078\Downloads\Edge下载\PowerShell-7.6.2-win-x64.zip`）
  - 解压到 `D:\dev\pwsh`
  - 将 `D:\dev\pwsh` 添加到系统 PATH
- [ ] 安装 Java JDK 17
  - 下载地址: https://adoptium.net/download/
  - 推荐安装路径: `D:\dev\jdk-17`
  - 将 `D:\dev\jdk-17\bin` 添加到系统 PATH
- [ ] 安装 Android Studio
  - 下载地址: https://developer.android.com/studio
  - IDE 路径: `D:\Program Files\Android\Android Studio`
  - SDK 路径: `D:\dev\android-sdk`
  - 安装时勾选 Android SDK、Platform-Tools、Emulator
  - 安装后在 SDK Manager 下载 Android API 34
- [ ] 运行 `flutter doctor` 验证无红色错误
- [ ] 配置 Flutter 国内镜像（环境变量）:
  - `PUB_HOSTED_URL` = `https://pub.flutter-io.cn`
  - `FLUTTER_STORAGE_BASE_URL` = `https://storage.flutter-io.cn`

**验收标准**: `flutter doctor` 输出中 Flutter 和 Android toolchain 均为绿色勾

---

### 🟡 中优先级（Phase 4: 离线同步 + AI 功能）

| 序号 | 任务编号 | 任务名称 | 优先级 | 依赖 | 负责人 | 状态 |
|------|---------|---------|--------|------|--------|------|
| 3 | P4-1 | 同步状态字段扩展 | 🟡 P2 | P2-4, P1-2 | AI Agent | ⬜ 待开始 |
| 4 | P4-2 | 离线写入逻辑 | 🟡 P2 | P4-1, P3-5 | AI Agent | ⬜ 待开始 |
| 5 | P4-3 | 同步引擎实现 | 🟡 P2 | P4-2 | AI Agent | ⬜ 待开始 |
| 6 | P4-4 | 网络状态监听 | 🟡 P2 | P4-3 | AI Agent | ⬜ 待开始 |
| 7 | P4-5 | 同步冲突 UI 提示 | 🟡 P2 | P4-3 | AI Agent | ⬜ 待开始 |
| 8 | P4-6 | AI 报告生成后端 API | 🟡 P2 | P1-7 | AI Agent | ⬜ 待开始 |
| 9 | P4-7 | AI 报告缓存与降级 | 🟡 P2 | P4-6 | AI Agent | ⬜ 待开始 |
| 10 | P4-8 | 移动端 AI 报告页面 | 🟡 P2 | P4-6, P3-2 | AI Agent | ⬜ 待开始 |

#### P4-1 ~ P4-5: 离线同步模块

**前置条件**: P0-1（Supabase 配置完成）、P0-2（Flutter 环境可用）

**实施步骤**:
1. P4-1: 在 Drift 表定义和 PG 迁移脚本中确认 sync_status/local_updated_at/server_updated_at 字段（已在 P2-4 中预置）
2. P4-2: 创建 `RecordProvider`、`MemberProvider`、`AssetTypeProvider`，所有写操作优先写入本地 Drift，标记 sync_status
3. P4-3: 创建 `SyncService` 类，实现 pullFromServer/pushToServer/resolveConflicts/fullSync
4. P4-4: 使用 `connectivity_plus` 监听网络变化，在线自动触发同步
5. P4-5: 冲突对话框 UI，支持用户选择保留本地/服务端版本

**验收标准**: 离线添加记录 → 恢复网络 → 数据自动同步到服务端

---

#### P4-6 ~ P4-8: AI 功能模块

**前置条件**: P0-1（Supabase 配置完成）、P1-7（所有路由适配完成）

**实施步骤**:
1. P4-6: 创建 `backend/routes/ai.js`，实现 POST /api/ai/report 和 POST /api/ai/anomaly
2. P4-7: 实现报告缓存（24h）+ 降级为规则引擎统计报告
3. P4-8: 创建 `ai_report_screen.dart`，使用 flutter_markdown 渲染报告

**验收标准**: 请求生成报告 → 返回 Markdown 格式分析报告 → 移动端正确渲染

---

### 🟢 低优先级（Phase 5: 测试、优化与发布）

| 序号 | 任务编号 | 任务名称 | 优先级 | 依赖 | 负责人 | 状态 |
|------|---------|---------|--------|------|--------|------|
| 11 | P5-1 | 后端 API 集成测试 | 🟢 P2 | P1-10 | AI Agent | ⬜ 待开始 |
| 12 | P5-2 | Flutter 单元测试 | 🟢 P2 | P3-8 | AI Agent | ⬜ 待开始 |
| 13 | P5-3 | Flutter Widget 测试 | 🟢 P2 | P5-2 | AI Agent | ⬜ 待开始 |
| 14 | P5-4 | 端到端流程测试 | 🟢 P2 | P4-8 | 用户手动 | ⬜ 待开始 |
| 15 | P5-5 | 性能优化 | 🟢 P2 | P5-4 | AI Agent | ⬜ 待开始 |
| 16 | P5-6 | iOS/Android 适配 | 🟢 P2 | P5-5 | AI Agent | ⬜ 待开始 |
| 17 | P5-7 | 应用打包与签名 | 🟢 P2 | P5-6 | 用户手动 | ⬜ 待开始 |
| 18 | P5-8 | CI/CD 更新 | 🟢 P2 | P5-1 | AI Agent | ⬜ 待开始 |

---

## 三、优先级排序说明

### 排序原则

1. **阻塞性优先**: 阻塞后续所有任务的必须先完成（P0-1、P0-2）
2. **依赖链深度**: 依赖链越长的任务越早启动（Phase 1 → Phase 4）
3. **用户价值**: 核心功能（CRUD）优先于增值功能（AI）
4. **风险等级**: 高风险任务提前暴露和解决

### 当前阻塞链

```
P0-1 (Supabase) ──→ 阻塞 Phase 1 验证 + Phase 4 后端
P0-2 (Flutter)  ──→ 阻塞 flutter pub get + flutter run + Phase 4 移动端
```

**结论**: P0-1 和 P0-2 是当前唯一需要用户手动完成的阻塞项，完成后 AI Agent 可并行推进 Phase 4 全部 8 个任务。

---

## 四、任务依赖关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        🔴 阻塞中（需用户手动）                    │
│                                                                 │
│  P0-1: Supabase 配置    P0-2: Flutter 环境搭建                  │
│  (注册账号 → 创建项目    (安装 PS7 → JDK17 → Android Studio)     │
│   → 配置 .env)                                                 │
└──────────┬──────────────────────┬───────────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│  Phase 1 验证     │   │  flutter pub get + flutter run   │
│  (npm test)      │   │  (验证移动端代码可编译运行)        │
└────────┬─────────┘   └──────────────┬───────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Phase 4: 离线同步 + AI                      │
│                                                             │
│  P4-1 ──→ P4-2 ──→ P4-3 ──→ P4-4 ──→ P4-5                 │
│  (字段)   (离线写) (同步引擎) (网络监听) (冲突UI)             │
│                                                             │
│  P4-6 ──→ P4-7 ──→ P4-8                                    │
│  (AI API) (缓存降级) (AI页面)                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Phase 5: 测试与发布                         │
│                                                             │
│  P5-1 (后端测试) ──→ P5-8 (CI/CD)                           │
│  P5-2 (单元测试) ──→ P5-3 (Widget测试) ──→ P5-4 (E2E)       │
│  P5-4 ──→ P5-5 (性能优化) ──→ P5-6 (平台适配) ──→ P5-7 (打包)│
└─────────────────────────────────────────────────────────────┘
```

---

## 五、风险跟踪

| 风险 | 概率 | 影响 | 关联任务 | 当前状态 | 缓解措施 |
|------|------|------|----------|----------|----------|
| Flutter 环境配置失败 | 中 | 高 | P0-2 | 🔴 进行中 | 提供详细安装指南，D 盘路径避免空格 |
| Supabase 免费层限制 | 低 | 中 | P0-1 | 🟢 可控 | 500MB 足够初期使用 |
| 离线同步数据丢失 | 中 | 高 | P4-2~P4-5 | 🔴 监控中 | 事务包裹 + 冲突检测 + 用户确认 |
| DeepSeek API 不稳定 | 中 | 低 | P4-6~P4-7 | 🟡 已降级 | Kimi 备用 + 规则引擎降级 |
| iOS 审核被拒 | 低 | 中 | P5-6~P5-7 | 🟢 可控 | 提前准备隐私政策 |
| PowerShell 版本兼容 | 低 | 低 | P0-2 | 🟡 处理中 | 已下载 PS 7.6.2 便携版 |

---

## 六、下一步行动建议

### 立即执行（用户手动）

1. **解压 PowerShell 7** → `D:\dev\pwsh` → 添加 PATH → 验证 `pwsh --version`
2. **验证 Flutter** → 新终端执行 `flutter --version`
3. **安装 JDK 17** → `D:\dev\jdk-17` → 添加 PATH
4. **安装 Android Studio** → 配置 SDK 到 `D:\dev\android-sdk`
5. **运行 `flutter doctor`** → 确认全部绿色

### 后续执行（AI Agent 自动）

6. `flutter pub get` 拉取移动端依赖
7. `dart run build_runner build` 生成 Drift 代码
8. Phase 4 全部 8 个任务并行推进

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始版本，基于对话历史提取待办任务 | AI Agent |
