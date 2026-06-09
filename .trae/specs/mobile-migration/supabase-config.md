# Supabase 数据库连接配置

> 创建日期: 2026-06-06 | 项目: Ricky Finance (资产管家)

---

## 连接信息

| 字段 | 值 |
|------|-----|
| **Host** | `aws-1-ap-northeast-2.pooler.supabase.com` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres.vuypcncjhbwyyvpcxlly` |
| **Password** | `*********`（见 `.env` 文件） |
| **区域** | Asia Pacific (Northeast - Seoul) |
| **连接方式** | Session pooler |

---

## 种子数据账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 管理员 |
| `head` | `head123` | 户主 |
| `member` | `member123` | 成员 |

---

## 验证状态

| 检查项 | 状态 | 日期 |
|--------|------|------|
| 数据库连接 | ✅ 成功 | 2026-06-06 |
| 数据库迁移 | ⬜ 待执行 | — |
| 种子数据 | ⬜ 待执行 | — |
| API 测试 | ⬜ 待执行 | — |

---

## 安全提醒

- `.env` 文件已在 `.gitignore` 中，不会被提交到 Git
- 密码仅存储在本地 `.env` 文件中
- 建议定期在 Supabase Dashboard → Settings → Database 中重置密码
