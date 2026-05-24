---
name: "translation-assistant"
description: "辅助翻译工具，将英文智能体、skill名称及描述翻译为中文。当需要翻译系统中的英文内容时调用。"
---

# Translation Assistant Tool

## Overview
该工具用于将系统中的英文内容（智能体名称、skill名称、描述等）翻译为中文，便于中文用户理解和使用。

## Features

1. **智能体翻译**：自动翻译所有智能体的名称和描述
2. **Skill翻译**：翻译所有技能模块的名称和描述
3. **MCP翻译**：翻译所有MCP组件的名称和描述
4. **批量翻译**：支持一次性翻译所有组件
5. **实时翻译**：支持单条内容的即时翻译

## Translation Mapping

### 智能体翻译
| 英文名称 | 中文名称 |
|---------|---------|
| data-analysis-agent | 数据分析智能体 |
| reminder-notification-agent | 提醒通知智能体 |
| data-sync-agent | 数据同步智能体 |
| report-generator-agent | 报表生成智能体 |
| anomaly-detection-agent | 异常检测智能体 |

### Skill翻译
| 英文名称 | 中文名称 |
|---------|---------|
| data-entry | 数据录入 |
| chart-visualization | 图表可视化 |
| data-export | 数据导出 |
| customer-management | 客户管理 |
| permission-management | 权限管理 |

### MCP翻译
| 英文名称 | 中文名称 |
|---------|---------|
| data-storage-mcp | 数据存储MCP |
| data-encryption-mcp | 数据加密MCP |
| cross-platform-sync-mcp | 跨平台同步MCP |
| notification-push-mcp | 通知推送MCP |

## Usage

1. **查看所有翻译**：调用工具查看完整的中英文对照列表
2. **翻译特定组件**：指定组件类型和名称进行翻译
3. **添加新翻译**：为新添加的组件添加中文翻译

## 目录结构
```
.trae/
├── agents/           # 智能体（英文）
├── skills/           # 技能（英文）
├── mcp/              # MCP组件（英文）
└── tools/
    └── translation-assistant/  # 翻译辅助工具
```

## 输出示例

```
已翻译的智能体列表：
1. data-analysis-agent → 数据分析智能体
   描述：分析客户资产变化趋势、生成洞察报告

2. reminder-notification-agent → 提醒通知智能体
   描述：提醒客户/管理员定期更新资产数据
```

---

**提示**：该工具会持续维护翻译映射表，当添加新的智能体、skill或MCP时，请及时更新翻译内容。
