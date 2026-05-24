---
name: "data-export"
description: "Exports customer asset data in Excel, PDF, and CSV formats. Invoke when user needs to download or share asset reports."
---

# Data Export Skill

## Overview
This skill enables exporting customer asset data in various standard formats.
Excel export follows the style template defined in `templates/2_资产分配记录表202601-202612.xlsx`.

## Features
- Export to Excel (.xlsx) with formatted sheets — **Implemented**
- Excel import (.xlsx / .xls / .csv) — **Implemented**
- Generate PDF reports with charts embedded — Planned
- Export raw data to CSV files — **Implemented**
- Customizable report templates — **Implemented** (template-based)
- Scheduled automatic exports — Planned
- Encrypted export options for sensitive data — Planned

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   前端 (Browser)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  public/js/excel-export.js (FinanceExcel)     │  │
│  │  - SheetJS CDN → 基础导出 / 导入              │  │
│  │  - 多 Sheet：总资产摘要 + 资产明细 + 客户汇总   │  │
│  │  - 智能表头识别导入                            │  │
│  └───────────────────────────────────────────────┘  │
│                        │                            │
│                        ▼ (API fallback)              │
├─────────────────────────────────────────────────────┤
│                   后端 (Node.js)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  server/services/excel-service.js             │  │
│  │  - ExcelJS → 高保真样式导出                   │  │
│  │  - 匹配模板所有样式：字体/配色/数字格式/冻结窗格│  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  server/routes/export.js                      │  │
│  │  - GET  /api/export/excel   → 后端样式导出    │  │
│  │  - POST /api/import/excel   → multer 文件导入  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Style Reference (from template)

| Element | Background | Font Color | Font / Size |
|---------|-----------|------------|-------------|
| Normal data | #FFFFFF | #000000 | Microsoft YaHei UI, 11pt |
| Date header row | #595959 | #FFFFFF | Microsoft YaHei UI, 11pt |
| Total row | #FFFF00 | #D3A400 | Microsoft YaHei UI, 16pt Bold |
| MoM growth row | #F2F2EA | #7A2A00 | 等线, 22pt Bold |
| Exchange/securities | #FF0000 | #FFFFFF | Microsoft YaHei UI, 11pt |
| Funds/fixed deposits | #00C0FF | — | Microsoft YaHei UI, 11pt |

### Number Formats
- `¥#,##0.00_);[Red](¥#,##0.00)` — RMB with red brackets for negative
- `¥#,##0.00;[Red]¥-#,##0.00` — RMB with red dash for negative
- `_ [$¥-804]* #,##0.00_` — Accounting alignment format
- `0.00%` — Percentage (2 decimals)
- `0_);[Red](0)` — Integer with red negative

### Layout
- Freeze pane at A1 → first column + header rows
- No gridlines
- Default row height: 30pt
- Column widths: 19 (name), 15.7 (data), 22 (wide)

## Usage Scenarios
- Generating periodic reports for clients
- Sharing data with external stakeholders
- Backing up data for compliance purposes
- Importing data into other financial tools
- Bulk importing records from spreadsheets

## Files

| File | Purpose |
|------|---------|
| `public/js/excel-export.js` | Frontend export/import module (FinanceExcel) |
| `server/services/excel-service.js` | Backend styled Excel generation (ExcelJS) |
| `server/routes/export.js` | Export/Import API routes |
| `templates/2_资产分配记录表202601-202612.xlsx` | Style reference template |

## Dependencies

- Frontend: `xlsx` (SheetJS) via CDN — `cdn.sheetjs.com/xlsx-0.20.3/...`
- Backend: `exceljs`, `multer` — `npm install`