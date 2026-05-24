/**
 * 资产管家 - 后端 Excel 生成服务
 * 使用 ExcelJS 实现高保真样式导出，参照模板：2_资产分配记录表202601-202612.xlsx
 *
 * 样式规范来源（从模板解析）：
 * - 主字体：Microsoft YaHei UI, 11pt
 * - 标题字体：Microsoft YaHei UI, 16pt
 * - 合计行：黄色底(#FFFF00) + 橙色字体(#D3A400), 16pt Bold
 * - 环比增长行：浅橙底(#F2F2EA) + 深橙字体(#7A2A00), 等线 22pt Bold
 * - 日期表头行：深灰底(#595959)
 * - 冻结首列 + 表头行
 * - 无网格线
 * - 数字格式：￥#,##0.00_);[红色](￥#,##0.00) 等
 */

const ExcelJS = require('exceljs');

const STYLE = {
  // 颜色
  COLOR_WHITE: 'FFFFFFFF',
  COLOR_BLACK: 'FF000000',
  COLOR_DARK_GRAY: 'FF595959',
  COLOR_YELLOW: 'FFFFFF00',
  COLOR_ORANGE_FONT: 'FFD3A400',
  COLOR_LIGHT_ORANGE_BG: 'FFF2F2EA',
  COLOR_DEEP_ORANGE_FONT: 'FF7A2A00',
  COLOR_RED_BG: 'FFFF0000',
  COLOR_CYAN_BG: 'FF00C0FF',
  COLOR_WHITE_BG: 'FFFFFFFF',
  COLOR_LIGHT_GRAY_BORDER: 'FFD9D9D9',
  COLOR_MEDIUM_BORDER: 'FFBFBFBF',

  // 字体
  FONT_MAIN: 'Microsoft YaHei UI',
  FONT_TITLE: 'Microsoft YaHei UI',
  FONT_DENGXIAN: '等线',

  // 数字格式
  FMT_RMB_BRACKET: '¥#,##0.00_);[Red](¥#,##0.00)',
  FMT_RMB_DASH: '¥#,##0.00;[Red]¥-#,##0.00',
  FMT_RMB_ACCOUNTING: '_ [$¥-804]* #,##0.00_ ;_ [$¥-804]* -#,##0.00_ ;_ [$¥-804]* "-"??_ ;_ @_ ',
  FMT_PERCENT: '0.00%',
  FMT_INTEGER_RED: '0_);[Red](0)',
  FMT_DATE_YM: 'yyyy/m/d',

  // 布局
  DEFAULT_ROW_HEIGHT: 30,
  HEADER_ROW_HEIGHT: 19,
  TITLE_ROW_HEIGHT: 17,
  CHART_ROW_HEIGHT: 16,
  COL_WIDTH_NAME: 19,
  COL_WIDTH_DATA: 15.7,
  COL_WIDTH_WIDE: 22,
  ZOOM_SCALE: 70
};

const ASSET_TYPE_LABELS = {
  stock: '股票',
  fund: '基金',
  bond: '债券',
  realestate: '房地产',
  cash: '现金',
  other: '其他'
};

const STATUS_LABELS = {
  valid: '有效',
  pending: '待审核',
  invalid: '无效'
};

/**
 * 主入口：生成完整的工作簿
 */
async function generateWorkbook(records, customers, options = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = '资产管家';
  wb.created = new Date();

  const periods = generateMonthlyPeriods(records);
  const summaryData = buildSummaryData(records, customers, periods);

  addSummarySheet(wb, summaryData, periods, options);
  addInvestmentSheet(wb, records, customers, periods, options);
  addMonthlyDetailSheets(wb, records, customers, periods, options);

  return wb;
}

/**
 * Sheet 1: 总资产摘要
 */
function addSummarySheet(wb, summaryData, periods, options) {
  const ws = wb.addWorksheet('总资产摘要', {
    views: [{ showGridLines: false, zoomScale: STYLE.ZOOM_SCALE, state: 'frozen', xSplit: 1, ySplit: 4 }],
    properties: { tabColor: { argb: 'FF7266BA' }, defaultRowHeight: STYLE.DEFAULT_ROW_HEIGHT }
  });

  const cols = summaryData.headers.length;
  ws.columns = summaryData.headers.map((h, i) => {
    const isFirst = i === 0;
    return {
      header: h,
      key: 'col_' + i,
      width: isFirst ? STYLE.COL_WIDTH_NAME : STYLE.COL_WIDTH_DATA,
      style: isFirst ? { alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } } : {}
    };
  });

  // --- Row 1: 标题行 ---
  const titleRow = ws.getRow(1);
  titleRow.height = STYLE.TITLE_ROW_HEIGHT;
  const titleCell = titleRow.getCell(1);
  titleCell.value = '总资产摘要';
  titleCell.font = { name: STYLE.FONT_TITLE, size: 16, bold: false, color: { argb: STYLE.COLOR_BLACK } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_WHITE_BG } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // --- Row 2: 日期表头行 ---
  const dateRow = ws.getRow(2);
  dateRow.height = STYLE.HEADER_ROW_HEIGHT;
  for (let c = 2; c <= periods.length + 1; c++) {
    const cell = dateRow.getCell(c);
    const p = periods[c - 2];
    cell.value = new Date(p.year, p.month - 1, 15);
    cell.numFmt = STYLE.FMT_DATE_YM;
    cell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_DARK_GRAY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  // 提示/趋势列
  const tipCell = dateRow.getCell(periods.length + 4);
  tipCell.value = '趋势';
  tipCell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_WHITE } };
  tipCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_DARK_GRAY } };
  tipCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // --- Row 3: 图表占位行 ---
  const chartRow = ws.getRow(3);
  chartRow.height = STYLE.CHART_ROW_HEIGHT;

  // --- Row 4: 列标题行 ---
  const headerRow = ws.getRow(4);
  headerRow.height = STYLE.HEADER_ROW_HEIGHT;
  const subHeaders = summaryData.headers;
  subHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: STYLE.FONT_MAIN, size: 11, bold: true, color: { argb: STYLE.COLOR_BLACK } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_WHITE_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } },
      bottom: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } },
      left: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } },
      right: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } }
    };
  });

  // --- 数据行 ---
  const dataStartRow = 5;
  summaryData.rows.forEach((row, idx) => {
    const r = ws.getRow(dataStartRow + idx);
    r.height = STYLE.DEFAULT_ROW_HEIGHT;

    row.forEach((val, ci) => {
      const cell = r.getCell(ci + 1);
      cell.value = val;
      cell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_BLACK } };
      cell.alignment = { horizontal: ci === 0 ? 'left' : 'right', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } },
        bottom: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } },
        left: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } },
        right: { style: 'thin', color: { argb: STYLE.COLOR_LIGHT_GRAY_BORDER } }
      };

      if (ci > 2 && ci < 2 + periods.length) {
        cell.numFmt = STYLE.FMT_RMB_BRACKET;
      }
    });

    // 资产归属列（第1列 = 客户名）根据类型着色
    const nameCell = r.getCell(1);
    const typeCell = r.getCell(3);
    const typeVal = typeCell.value || '';
    if (typeVal === '股票' || typeVal === '比特币') {
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_RED_BG } };
      nameCell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_WHITE } };
    } else if (typeVal === '基金' || typeVal === '定期' || typeVal === '定期等安全投资') {
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_CYAN_BG } };
    }
  });

  // --- 合计行 ---
  const totalRowIdx = dataStartRow + summaryData.rows.length;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.height = STYLE.DEFAULT_ROW_HEIGHT;

  summaryData.totals.forEach((val, ci) => {
    const cell = totalRow.getCell(ci + 4);
    cell.value = val;
    cell.font = { name: STYLE.FONT_MAIN, size: 16, bold: true, color: { argb: STYLE.COLOR_ORANGE_FONT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_YELLOW } };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.numFmt = STYLE.FMT_RMB_DASH;
    cell.border = {
      top: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } },
      bottom: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } },
      left: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } },
      right: { style: 'thin', color: { argb: STYLE.COLOR_MEDIUM_BORDER } }
    };
  });
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = '合计';
  totalLabelCell.font = { name: STYLE.FONT_MAIN, size: 16, bold: true, color: { argb: STYLE.COLOR_ORANGE_FONT } };
  totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_YELLOW } };

  // 冻结窗格
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 4, zoomScale: STYLE.ZOOM_SCALE, showGridLines: false }];
}

/**
 * Sheet 2: 投资收益表
 */
function addInvestmentSheet(wb, records, customers, periods, options) {
  const ws = wb.addWorksheet('投资收益表', {
    views: [{ showGridLines: false, zoomScale: STYLE.ZOOM_SCALE }],
    properties: { tabColor: { argb: 'FFFF0000' }, defaultRowHeight: STYLE.DEFAULT_ROW_HEIGHT }
  });

  const invCategories = ['东方财富（A股）', '长桥证券（美港股）', '比特币', '基金（招行）', '定期'];
  const typeMap = {
    '东方财富（A股）': 'stock',
    '长桥证券（美港股）': 'stock',
    '比特币': 'other',
    '基金（招行）': 'fund',
    '定期': 'cash'
  };

  // Row 1: 标题
  ws.getRow(1).height = STYLE.TITLE_ROW_HEIGHT;
  ws.getCell('A1').value = '投资收益率趋势';
  ws.getCell('A1').font = { name: STYLE.FONT_TITLE, size: 16, color: { argb: STYLE.COLOR_BLACK } };

  // Row 2: 日期行
  const dateRow = ws.getRow(2);
  dateRow.height = STYLE.HEADER_ROW_HEIGHT;
  for (let c = 2; c <= periods.length + 1; c++) {
    const p = periods[c - 2];
    const cell = dateRow.getCell(c);
    cell.value = new Date(p.year, p.month - 1, 15);
    cell.numFmt = STYLE.FMT_DATE_YM;
    cell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLE.COLOR_DARK_GRAY } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Row 4: 列标题
  const headerRow = ws.getRow(4);
  headerRow.height = STYLE.HEADER_ROW_HEIGHT;
  const hHeaders = ['投资分类', ...periods.map(p => p.label), '全年统计', '环比增长'];
  hHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: STYLE.FONT_MAIN, size: 11, bold: true, color: { argb: STYLE.COLOR_BLACK } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // 数据行
  invCategories.forEach((cat, idx) => {
    const r = ws.getRow(5 + idx);
    r.height = STYLE.DEFAULT_ROW_HEIGHT;
    const cell1 = r.getCell(1);
    cell1.value = cat;
    cell1.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_BLACK } };
    cell1.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

    const mapType = typeMap[cat] || 'other';
    periods.forEach((p, pi) => {
      const sum = records
        .filter(r => r.type === mapType && isInPeriod(r.date, p))
        .reduce((s, r) => s + ((r.value || 0) - (r.previousValue || 0)), 0);
      const cell = r.getCell(2 + pi);
      cell.value = sum;
      cell.numFmt = STYLE.FMT_RMB_BRACKET;
      cell.font = { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_BLACK } };
    });
  });

  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 4, zoomScale: STYLE.ZOOM_SCALE, showGridLines: false }];
}

/**
 * 月度明细 Sheet（3-14: 1月-12月）
 */
function addMonthlyDetailSheets(wb, records, customers, periods, options) {
  const monthNames = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9月', '10月', '11 月', '12 月'];
  const tabColors = ['FFC00000', 'FFFF0000', 'FFFFFF00', 'FF50C878', 'FF50A0C8', 'FFF0A000', 'FFC000F0', 'FF60A000', 'FFA0A0A0', 'FFC00000', 'FFFF0000', 'FF00C0FF'];

  monthNames.forEach((name, idx) => {
    const m = idx + 1;
    const ws = wb.addWorksheet(name, {
      views: [{ showGridLines: false, zoomScale: STYLE.ZOOM_SCALE }],
      properties: { tabColor: { argb: tabColors[idx] }, defaultRowHeight: STYLE.DEFAULT_ROW_HEIGHT }
    });

    ws.getCell('A1').value = name + '支出';
    ws.getCell('A1').font = { name: STYLE.FONT_TITLE, size: 14, color: { argb: STYLE.COLOR_BLACK } };

    const detailHeaders = ['日期', 'PO#', '汇率（特殊-CNY）', '特殊币种', '金额', '类别', '描述', '分类'];
    const headerRow = ws.getRow(2);
    headerRow.height = STYLE.HEADER_ROW_HEIGHT;
    detailHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: STYLE.FONT_MAIN, size: 11, bold: true, color: { argb: STYLE.COLOR_BLACK } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    ws.columns = detailHeaders.map((h, i) => ({
      header: h,
      key: 'col_' + i,
      width: i === 4 ? STYLE.COL_WIDTH_WIDE : STYLE.COL_WIDTH_DATA
    }));

    // 筛选当月记录
    const year = periods[0] ? periods[0].year : new Date().getFullYear();
    const monthRecords = records.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getMonth() + 1 === m && d.getFullYear() === year;
    });

    monthRecords.forEach((rec, ri) => {
      const r = ws.getRow(3 + ri);
      r.height = STYLE.DEFAULT_ROW_HEIGHT;
      r.getCell(1).value = rec.date ? new Date(rec.date) : '';
      r.getCell(1).numFmt = STYLE.FMT_DATE_YM;
      r.getCell(2).value = 'A-' + String(10000 + ri).slice(1);
      r.getCell(4).value = '';
      r.getCell(5).value = rec.value || 0;
      r.getCell(5).numFmt = STYLE.FMT_RMB_BRACKET;
      r.getCell(6).value = (customers[rec.customerId] || {}).name || '';
      r.getCell(7).value = rec.note || '';
      r.getCell(8).value = ASSET_TYPE_LABELS[rec.type] || rec.type;

      for (let c = 1; c <= 8; c++) {
        const cell = r.getCell(c);
        cell.font = cell.font || { name: STYLE.FONT_MAIN, size: 11, color: { argb: STYLE.COLOR_BLACK } };
        cell.alignment = cell.alignment || { horizontal: 'center', vertical: 'middle' };
      }
    });
  });
}

// ============ 工具函数 ============

function generateMonthlyPeriods(records) {
  const periods = [];
  const currentYear = new Date().getFullYear();
  for (let m = 1; m <= 12; m++) {
    periods.push({ key: currentYear + '-' + String(m).padStart(2, '0'), label: m + '月', year: currentYear, month: m });
  }
  return periods;
}

function isInPeriod(dateStr, period) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === period.year && (d.getMonth() + 1) === period.month;
}

function buildSummaryData(records, customers, periods) {
  const groupMap = {};

  records.forEach(r => {
    const key = r.customerId + '|' + r.type;
    if (!groupMap[key]) {
      groupMap[key] = { customerId: r.customerId, type: r.type, values: new Array(periods.length).fill(0) };
    }
    const pi = periods.findIndex(p => isInPeriod(r.date, p));
    if (pi >= 0) {
      groupMap[key].values[pi] += (r.value || 0);
    }
  });

  const groupList = Object.values(groupMap).sort((a, b) => {
    if (a.customerId !== b.customerId) return a.customerId - b.customerId;
    return (a.type || '').localeCompare(b.type || '');
  });

  const headers = ['资产归属', '客户', '资产类型', ...periods.map(p => p.label), '全年统计', '环比增长'];
  const rows = [];

  groupList.forEach(g => {
    const c = customers[g.customerId] || {};
    const row = [
      c.code || '',
      c.name || '客户' + g.customerId,
      ASSET_TYPE_LABELS[g.type] || g.type,
      ...g.values,
      g.values.reduce((a, b) => a + b, 0),
      ''
    ];
    rows.push(row);
  });

  const totals = new Array(periods.length).fill(0);
  rows.forEach(row => {
    row.slice(3, 3 + periods.length).forEach((v, i) => { totals[i] += (v || 0); });
  });

  return { headers, rows, totals };
}

// ============ 导出 ============

module.exports = {
  STYLE,
  generateWorkbook,
  generateMonthlyPeriods,
  buildSummaryData,
  ASSET_TYPE_LABELS,
  STATUS_LABELS
};