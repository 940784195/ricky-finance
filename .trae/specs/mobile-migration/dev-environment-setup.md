# 开发环境配置指南

> 版本: v1.1 | 更新日期: 2026-06-06 | 适用项目: 资产管家 (Ricky Finance)

---

## 一、环境搭建流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        开发环境搭建流程                               │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ 1.Node.js│───→│ 2.Git    │───→│ 3.PS 7   │───→│ 4.JDK 17      │  │
│  │  v24.16  │    │  v2.54   │    │  v7.6.2  │    │  v17.0.19     │  │
│  └──────────┘    └──────────┘    └──────────┘    └───────┬───────┘  │
│                                                          │          │
│                                                          ▼          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ 8.验证   │←───│ 7.镜像   │←───│ 6.Android│←───│ 5.Flutter SDK │  │
│  │  doctor  │    │  配置    │    │  Studio  │    │  3.29.3       │  │
│  └────┬─────┘    └──────────┘    └──────────┘    └───────────────┘  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ 9.Supabase│───→│10.npm   │───→│11.flutter│───→│ 12.开始开发   │  │
│  │  配置    │    │  install │    │  pub get │    │               │  │
│  └──────────┘    └──────────┘    └──────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、操作系统要求

| 项目 | 要求 | 当前状态 |
|------|------|---------|
| 操作系统 | Windows 10 64-bit (1909+) 或 Windows 11 | ✅ Windows 10 专业版 64-bit, 22H2, 2009 |
| 架构 | x86-64 | ✅ |
| 磁盘空间 | 至少 20 GB 可用空间 | ✅ D 盘可用 |
| 内存 | 至少 8 GB（推荐 16 GB） | ✅ |
| 网络 | 可访问 GitHub、pub.dev、supabase.com | ⚠️ GitHub 偶有超时（不影响开发） |

---

## 三、工具清单与安装指南

### 3.1 Node.js（后端运行时）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | 后端 Express 服务运行、npm 包管理、测试执行 |
| **当前版本** | **v24.16.0** ✅ |
| **安装路径** | `C:\Program Files\nodejs\` |
| **下载地址** | https://nodejs.org/en/download |
| **验证命令** | `node --version` → `v24.16.0` |

---

### 3.2 Git（版本控制）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | 代码版本管理、分支协作 |
| **当前版本** | **v2.54.0** ✅ |
| **安装路径** | `C:\Program Files\Git\` |
| **下载地址** | https://git-scm.com/download/win |
| **验证命令** | `git --version` → `git version 2.54.0.windows.1` |

> ⚠️ **踩坑记录**: Git 在系统 PATH 中但 Flutter 无法识别，需同时添加到用户 PATH（`C:\Program Files\Git\cmd` 和 `C:\Program Files\Git\bin`）。

---

### 3.3 PowerShell 7（终端环境）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | Flutter 命令执行终端（Flutter 要求 pwsh.exe 在 PATH 中） |
| **当前版本** | **PowerShell 7.6.2** ✅ |
| **安装路径** | `D:\dev\pwsh\` |
| **下载地址** | https://github.com/PowerShell/PowerShell/releases |
| **验证命令** | `pwsh --version` → `PowerShell 7.6.2` |

**安装方式**: 便携版 ZIP 解压（无需安装程序）
1. 下载 `PowerShell-7.6.2-win-x64.zip`
2. 解压到 `D:\dev\pwsh`
3. 添加 `D:\dev\pwsh` 到系统 PATH

---

### 3.4 Java JDK 17（Android 编译依赖）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | Android Gradle 编译必需 |
| **当前版本** | **JDK 17.0.19 (Eclipse Adoptium)** ✅ |
| **安装路径** | `D:\dev\jdk-17\` |
| **下载地址** | https://adoptium.net/download/ |
| **验证命令** | `java -version` → `openjdk version "17.0.19"` |

**安装方式**: 便携版 ZIP 解压
1. 下载 `OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip`
2. 解压到 `D:\dev\jdk-17`
3. 添加 `JAVA_HOME = D:\dev\jdk-17` 系统变量
4. 添加 `D:\dev\jdk-17\bin` 到系统 PATH

> ⚠️ 注意: ZIP 解压后可能多一层文件夹，确保 `D:\dev\jdk-17\bin\java.exe` 直接存在。

---

### 3.5 Flutter SDK（移动端框架）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | 移动端应用开发、编译、运行 |
| **当前版本** | **Flutter 3.29.3 Stable** ✅ |
| **Dart 版本** | 随 Flutter 自动下载 |
| **安装路径** | `D:\dev\flutter\` |
| **下载地址** | https://docs.flutter.dev/get-started/install/windows |
| **验证命令** | `flutter --version` → `Flutter 3.29.3 • channel stable` |

**安装方式**: ZIP 解压
1. 下载 `flutter_windows_3.29.3-stable.zip`
2. 解压到 `D:\dev\flutter`
3. 添加 `D:\dev\flutter\bin` 到系统 PATH

---

### 3.6 Android Studio（Android 开发工具）✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | Android SDK 管理、模拟器运行、APK 打包 |
| **当前版本** | **Android Studio Ladybug 2024.2+** ✅ |
| **国内镜像** | https://mirrors.huaweicloud.com/androidstudio/ |
| **备用镜像** | https://mirrors.cloud.tencent.com/AndroidSDK/ |
| **官方国内** | https://developer.android.google.cn/studio?hl=zh-cn |
| **IDE 路径** | `D:\Program Files\Android\Android Studio` |
| **SDK 路径** | `D:\dev\android-sdk` |

**安装步骤**:
1. 从华为云镜像下载 `.exe` 安装包
2. 安装时 IDE 路径改为 `D:\Program Files\Android\Android Studio`
3. 勾选 **Android Virtual Device**
4. 首次启动后 SDK Manager → SDK 路径改为 `D:\dev\android-sdk`
5. 下载 Android SDK Platform 34 + Build-Tools 34.0.0 + Emulator
6. 创建模拟器: Pixel 6 → API 34

**环境变量**:
| 变量名 | 值 |
|--------|-----|
| `ANDROID_HOME` | `D:\dev\android-sdk` |
| `ANDROID_SDK_ROOT` | `D:\dev\android-sdk` |

PATH 添加:
```
D:\dev\android-sdk\platform-tools
D:\dev\android-sdk\emulator
```

**NDK 与 CMake 配置**:

| 组件 | 版本 | 路径 |
|------|------|------|
| NDK (Side-by-side) | **27.0.12077973** | `D:\dev\android-sdk\ndk\27.0.12077973` |
| CMake | **3.22.1**（随 Android SDK 自动管理） | `D:\dev\android-sdk\cmake\3.22.1.4988404` |

> ⚠️ **NDK 版本说明**: 项目 `build.gradle.kts` 中 `ndkVersion = "27.0.12077973"`，需在 SDK Manager → SDK Tools 中勾选 "NDK (Side by side)" → 安装 27.0.12077973。CMake 无需手动安装，Gradle 会自动使用 Android SDK 内置版本。

**模拟器配置**:
- 设备: Pixel 6
- API 级别: 34
- 验证: `flutter devices` 可检测到模拟器，`flutter run` 可正常启动应用

---

### 3.7 Flutter 国内镜像 ✅ 已配置

| 变量名 | 值 | 状态 |
|--------|-----|------|
| `PUB_HOSTED_URL` | `https://pub.flutter-io.cn` | ✅ |
| `FLUTTER_STORAGE_BASE_URL` | `https://storage.flutter-io.cn` | ✅ |

配置位置: 用户环境变量

---

### 3.8 Visual Studio ✅ 已安装

| 项目 | 详情 |
|------|------|
| **用途** | Windows 桌面应用开发（Flutter Windows 编译） |
| **当前版本** | Visual Studio Community 2019 16.11.26 |
| **状态** | ✅ `flutter doctor` 检测通过 |

---

## 四、项目依赖清单

### 4.1 后端 (Node.js) — `package.json`

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | ^5.2.1 | Web 框架 |
| pg | ^8.13.0 | PostgreSQL 客户端 |
| jsonwebtoken | ^9.0.3 | JWT 认证 |
| bcryptjs | ^3.0.3 | 密码哈希 |
| cors | ^2.8.6 | 跨域处理 |
| dotenv | ^16.4.0 | 环境变量管理 |
| exceljs | ^4.4.0 | Excel 导出 |
| multer | ^1.4.5 | 文件上传 |
| axios | ^1.7.0 | HTTP 请求 |
| better-sqlite3 | ^12.10.0 | 遗留 SQLite 支持 |
| jest | ^30.4.2 | 测试框架 (dev) |
| supertest | ^7.2.2 | HTTP 测试 (dev) |

安装命令:
```powershell
cd D:\TRAEworkspace\Ricky_finance_repository\Ricky_finance
npm install
```

---

### 4.2 移动端 (Flutter) — `pubspec.yaml`

| 依赖 | 版本 | 用途 |
|------|------|------|
| provider | ^6.1.2 | 状态管理 |
| http | ^1.2.1 | HTTP 网络请求 |
| shared_preferences | ^2.2.3 | 本地键值存储 |
| fl_chart | ^0.68.0 | 图表组件 |
| intl | ^0.19.0 | 国际化/格式化 |
| connectivity_plus | ^6.0.3 | 网络状态监听 |
| flutter_markdown | ^0.7.1 | Markdown 渲染 |
| drift | ^2.16.1 | 本地 SQLite ORM |
| drift_flutter | ^0.2.1 | Drift Flutter 集成 |
| sqlite3_flutter_libs | ^0.5.24 | SQLite 原生库 |
| path_provider | ^2.1.3 | 文件路径 |
| path | ^1.9.0 | 路径工具 |
| drift_dev | ^2.16.1 | Drift 代码生成 (dev) |
| build_runner | ^2.4.9 | 代码生成运行器 (dev) |
| flutter_lints | ^4.0.0 | Lint 规则 (dev) |

安装命令:
```powershell
cd D:\TRAEworkspace\Ricky_finance_repository\Ricky_finance\mobile\ricky_finance_mobile
flutter pub get
dart run build_runner build
```

---

## 五、外部服务配置

### 5.1 Supabase（数据库托管）⬜ 待配置

| 项目 | 详情 |
|------|------|
| **用途** | PostgreSQL 数据库托管 |
| **注册地址** | https://supabase.com |
| **免费层** | 500MB 数据库 + 5GB 带宽/月 |
| **推荐区域** | Asia Pacific (Southeast Asia) |

> ⚠️ **当前状态**: Supabase 云端数据库因 DNS 解析问题暂时无法连接（`getaddrinfo ENOTFOUND aws-1-ap-northeast-2.pooler.supabase.com`），当前使用**本地 PostgreSQL** 进行开发测试。后续可切换到 Supabase 或继续使用本地数据库。

配置步骤:
1. 注册账号 → 创建新项目 → 设置数据库密码
2. Project Settings → Database → Connection string → 复制信息
3. 在项目根目录创建 `.env` 文件:
```
SUPABASE_DB_HOST=db.xxxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
JWT_SECRET=ricky_finance_jwt_secret_2024
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
KIMI_API_KEY=sk-your-kimi-api-key
NODE_ENV=development
```
4. 运行迁移: `node backend/db/migrate.js`
5. 初始化数据: `node backend/db/seed.js`
6. 验证: `npm test`

**本地 PostgreSQL 替代方案**（当前使用）:
- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- 测试通过: 99 个测试用例全部通过 ✅

---

### 5.2 AI API（可选，Phase 4 需要）

| 服务 | 注册地址 | 用途 |
|------|---------|------|
| DeepSeek | https://platform.deepseek.com | AI 报告生成（主） |
| Kimi (Moonshot) | https://platform.moonshot.cn | AI 报告生成（备用） |

---

## 六、工具配置检查清单

### 安装前检查

- [x] 操作系统: Windows 10 专业版 64-bit, 22H2 ✅
- [x] 磁盘空间: D 盘可用 ✅
- [x] 网络: 可访问 GitHub（偶有超时）、pub.dev（通过镜像） ✅

### 安装后逐项验证

| 序号 | 工具 | 验证命令 | 预期输出 | 状态 |
|------|------|---------|---------|------|
| 1 | Node.js | `node --version` | `v24.16.0` | ✅ |
| 2 | npm | `npm --version` | `10.x.x` | ✅ |
| 3 | Git | `git --version` | `git version 2.54.0` | ✅ |
| 4 | PowerShell 7 | `pwsh --version` | `PowerShell 7.6.2` | ✅ |
| 5 | JDK 17 | `java -version` | `openjdk version "17.0.19"` | ✅ |
| 6 | Flutter | `flutter --version` | `Flutter 3.29.3` | ✅ |
| 7 | Dart | `dart --version` | `Dart SDK version: 3.x` | ✅ |
| 8 | Android SDK | `flutter doctor` | Android toolchain ✅ | ✅ |
| 9 | 后端依赖 | `npm install` | 无错误 | ✅ |
| 10 | 移动端依赖 | `flutter pub get` | 无错误 | ✅ |
| 11 | Drift 生成 | `dart run build_runner build` | 无错误 | ✅ |
| 12 | 后端测试 | `npm test` | 99 passed | ✅ |
| 13 | Android 模拟器 | `flutter run` | 应用正常启动 | ✅ |

---

## 七、系统 PATH 最终配置

### 用户 PATH
```
C:\Users\94078\AppData\Local\Microsoft\WindowsApps
C:\Users\94078\AppData\Roaming\npm
D:\dev\flutter\bin
C:\Program Files\Git\cmd
C:\Program Files\Git\bin
```

### 系统 PATH
```
C:\Windows\System32          ← 必须保留！
C:\Windows                   ← 必须保留！
C:\Windows\System32\Wbem     ← 必须保留！
D:\dev\flutter\bin
C:\Program Files\Git\cmd
D:\dev\pwsh
C:\Program Files\Git\bin
D:\dev\jdk-17\bin
```

### 系统环境变量
```
JAVA_HOME = D:\dev\jdk-17
```

### 用户环境变量
```
PUB_HOSTED_URL = https://pub.flutter-io.cn
FLUTTER_STORAGE_BASE_URL = https://storage.flutter-io.cn
```

---

## 八、常见错误排查指南

### 错误 1: `Error: PowerShell executable not found`

**现象**: 运行 `flutter --version` 时报错
```
Error: PowerShell executable not found.
Either pwsh.exe or PowerShell.exe must be in your PATH.
```

**原因**: Flutter 优先查找 `pwsh.exe`（PowerShell 7），系统中只有 `powershell.exe`（v5.1）

**解决**:
1. 下载 PowerShell 7 便携版 ZIP
2. 解压到 `D:\dev\pwsh`
3. 添加 `D:\dev\pwsh` 到系统 PATH
4. 新开终端验证: `pwsh --version`

---

### 错误 2: `Unable to find git in your PATH`

**现象**: `flutter --version` 报 Git 找不到，但 `git --version` 能正常执行

**原因**: Git 在系统 PATH 中，但 Flutter 的 Dart VM 优先读取用户 PATH

**解决**:
1. 将 `C:\Program Files\Git\cmd` 和 `C:\Program Files\Git\bin` 同时添加到**用户 PATH**
2. 重启终端

---

### 错误 3: `Cannot find the executable for 'where'`

**现象**: Flutter 报找不到 `where.exe`
```
Cannot find the executable for `where`. This can happen if the System32 folder
is removed from the PATH environment variable.
```

**原因**: 编辑系统 PATH 时不小心覆盖了 Windows 默认路径

**解决**:
1. 在系统 PATH 最前面添加:
   - `C:\Windows\System32`
   - `C:\Windows`
   - `C:\Windows\System32\Wbem`
2. 重启终端

---

### 错误 4: `Got socket error trying to find package at https://pub.dev`

**现象**: Flutter 初始化时下载包超时

**原因**: 国内网络无法直接访问 pub.dev

**解决**:
1. 添加用户环境变量:
   - `PUB_HOSTED_URL = https://pub.flutter-io.cn`
   - `FLUTTER_STORAGE_BASE_URL = https://storage.flutter-io.cn`
2. 重启终端

---

### 错误 5: `Unable to create dart snapshot for flutter tool`

**现象**: Flutter 初始化失败，无法生成快照

**原因**: 之前的初始化被网络/Git 问题中断，缓存损坏

**解决**:
1. 删除 `D:\dev\flutter\bin\cache` 文件夹
2. 确认 Git 和镜像配置正确
3. 重新执行 `flutter --version`

---

### 错误 6: `Android SDK not found`

**现象**: `flutter doctor` 显示 Android toolchain ❌

**原因**: Android Studio 未安装或 SDK 未配置

**解决**:
1. 从国内镜像下载 Android Studio
2. SDK Manager → 下载 Android SDK Platform 34
3. 设置环境变量 `ANDROID_HOME = D:\dev\android-sdk`
4. 运行 `flutter doctor --android-licenses` 接受许可

---

### 错误 7: `A later version of Node.js is already installed`

**现象**: 安装 Node.js 时报版本冲突

**原因**: 系统已安装更高版本（v24.16.0 > v20.20.2）

**解决**: 无需操作，当前 v24.16.0 完全满足项目需求

---

### 错误 8: `ninja: fatal: GetOverlappedResult` (CMake 版本冲突)

**现象**: Android 构建时 CMake/ninja 编译失败
```
ninja: fatal: GetOverlappedResult: 操作成功完成
```

**原因**: `build.gradle.kts` 中显式指定了 CMake 版本（如 3.26.3），与 NDK 27 不兼容

**解决**:
1. 移除 `build.gradle.kts` 中 `externalNativeBuild { cmake { version = "..." } }` 配置
2. 让 Gradle 自动使用 Android SDK 内置的 CMake 3.22.1（与 NDK 27 兼容）
3. 确保 `ndkVersion = "27.0.12077973"` 与 SDK Manager 中安装的 NDK 版本一致

---

### 错误 9: `Type 'Color' not found` (缺少 Flutter 依赖)

**现象**: 编译时报 `Error: Type 'Color' not found`

**原因**: `formatters.dart` 中使用了 `Color` 类但未导入 `package:flutter/material.dart`

**解决**: 在 `lib/utils/formatters.dart` 文件顶部添加:
```dart
import 'package:flutter/material.dart';
```

---

### 错误 10: Gradle 仓库配置冲突

**现象**:
```
Build was configured to prefer settings repositories over project repositories 
but repository 'maven' was added by settings file 'settings.gradle.kts'
```

**原因**: `settings.gradle.kts` 中 `dependencyResolutionManagement` 的 `repositoriesMode` 设置为 `FAIL_ON_PROJECT_REPOS`，但 plugin 声明中又添加了 `maven` 仓库

**解决**: 修改 `settings.gradle.kts`，将 `repositoriesMode` 改为 `PREFER_SETTINGS`:
```kotlin
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}
```

---

### 错误 11: Gradle 下载超时（网络问题）

**现象**: 首次构建时 Gradle Wrapper 下载超时
```
java.net.SocketException: Connection reset
```

**原因**: 国内网络访问 `services.gradle.org` 不稳定

**解决**:
1. 等待重试（Gradle Wrapper 会自动重试）
2. 或手动下载 `gradle-8.x-bin.zip` 放到 `%USERPROFILE%\.gradle\wrapper\dists\` 对应目录
3. 或配置 Gradle 国内镜像（`%USERPROFILE%\.gradle\init.gradle`）

---

## 九、推荐 IDE 与插件

### VS Code（推荐用于 Flutter 开发）

| 项目 | 详情 |
|------|------|
| 下载地址 | https://code.visualstudio.com |
| 必装插件 | Flutter、Dart、Prettier |
| 推荐插件 | GitLens、Thunder Client、Material Icon Theme |

### Android Studio（用于 Android 原生调试）

| 项目 | 详情 |
|------|------|
| 国内镜像 | https://mirrors.huaweicloud.com/androidstudio/ |
| 必装插件 | Flutter、Dart（已内置） |

---

## 十、当前环境状态总览

```
✅ Node.js v24.16.0       C:\Program Files\nodejs\
✅ npm                    (随 Node.js)
✅ Git v2.54.0            C:\Program Files\Git\
✅ PowerShell 7.6.2       D:\dev\pwsh\
✅ JDK 17.0.19            D:\dev\jdk-17\
✅ Flutter 3.29.3         D:\dev\flutter\
✅ Dart SDK               (随 Flutter)
✅ Visual Studio 2019     (Windows 桌面开发)
✅ Chrome                 (Web 开发)
✅ Flutter 国内镜像       已配置
✅ Android Studio         D:\Program Files\Android\Android Studio
✅ Android SDK            D:\dev\android-sdk (Platform 34)
✅ NDK 27.0.12077973      D:\dev\android-sdk\ndk\27.0.12077973
✅ CMake 3.22.1           (随 Android SDK)
✅ Android 模拟器          Pixel 6 API 34，应用可正常启动运行
✅ 后端测试               99 个测试用例全部通过
✅ 本地 PostgreSQL        连接正常
⬜ Supabase 云端数据库     (DNS 解析问题，待后续解决)
⬜ .env 文件              (待创建)
```

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-06-06 | v1.0 | 初始版本，基于项目实际环境检测结果 | AI Agent |
| 2026-06-06 | v1.1 | 更新所有工具实际版本号，添加踩坑记录和已解决问题，标记已完成项 | AI Agent |
| 2026-06-11 | v1.2 | 更新 Android Studio/NDK/CMake 为已安装状态；新增模拟器配置说明；新增错误 8-11（CMake冲突/Color缺失/Gradle仓库/Gradle超时）；更新环境状态总览和验证清单；标记后端测试通过和本地 PostgreSQL 可用 | AI Agent |
