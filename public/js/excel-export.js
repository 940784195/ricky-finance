/**
 * 资产管家 - Excel 导出 / 导入模块
 * 参照模板样式：2_资产分配记录表202601-202612.xlsx
 *
 * 前端方案：SheetJS (xlsx) CDN → 基础导出 / 导入
 * 后端方案：ExcelJS → 高保真样式导出
 */

var FinanceExcel = (function () {
  'use strict';

  var ASSET_TYPE_LABELS = {
    stock: '股票',
    fund: '基金',
    bond: '债券',
    realestate: '房地产',
    cash: '现金',
    other: '其他'
  };

  var STATUS_LABELS = {
    valid: '有效',
    pending: '待审核',
    invalid: '无效'
  };

  // ============ 工具函数 ============

  function loadXLSX() {
    if (typeof XLSX !== 'undefined') return Promise.resolve(XLSX);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = function () { resolve(XLSX); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '/' + m + '/' + day;
  }

  /**
   * 将记录按客户 → 资产类型分组，构建二维汇总表
   * 返回结构：{ headers, rows, summary }
   */
  function buildSummaryTable(records, customers, periods) {
    periods = periods || generateMonthlyPeriods(records);

    var groupMap = {};
    var rowIndex = 0;

    records.forEach(function (r) {
      var key = r.customerId + '|' + r.type;
      if (!groupMap[key]) {
        groupMap[key] = {
          customerId: r.customerId,
          type: r.type,
          entries: {}
        };
      }
      var monthKey = dateToPeriodKey(r.date, periods);
      if (!groupMap[key].entries[monthKey]) {
        groupMap[key].entries[monthKey] = [];
      }
      groupMap[key].entries[monthKey].push(r);
    });

    var groupList = [];
    Object.keys(groupMap).forEach(function (k) { groupList.push(groupMap[k]); });

    groupList.sort(function (a, b) {
      if (a.customerId !== b.customerId) return a.customerId - b.customerId;
      return (a.type || '').localeCompare(b.type || '');
    });

    var headers = ['客户', '资产归属', '资产类型'];
    periods.forEach(function (p) { headers.push(p.label); });
    headers.push('合计');
    headers.push('变化率');

    var rows = [];
    var totals = {};
    periods.forEach(function (p) { totals[p.key] = 0; });

    groupList.forEach(function (g) {
      var customer = customers[g.customerId] || {};
      var row = [
        customer.name || '客户' + g.customerId,
        customer.code || '',
        ASSET_TYPE_LABELS[g.type] || g.type
      ];
      var rowTotal = 0;
      periods.forEach(function (p) {
        var entries = g.entries[p.key] || [];
        var sum = entries.reduce(function (s, e) { return s + (e.value || 0); }, 0);
        row.push(sum);
        rowTotal += sum;
        totals[p.key] = (totals[p.key] || 0) + sum;
      });
      row.push(rowTotal);
      row.push('');
      rows.push(row);
    });

    var totalRow = ['合计', '', ''];
    var grandTotal = 0;
    periods.forEach(function (p) {
      totalRow.push(totals[p.key]);
      grandTotal += totals[p.key];
    });
    totalRow.push(grandTotal);
    totalRow.push('');
    rows.push(totalRow);

    return { headers: headers, rows: rows, periods: periods };
  }

  function dateToPeriodKey(dateStr, periods) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var key = y + '-' + String(m).padStart(2, '0');
    for (var i = 0; i < periods.length; i++) {
      if (periods[i].key === key) return key;
    }
    return key;
  }

  function generateMonthlyPeriods(records) {
    var months = {};
    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;

    for (var m = 1; m <= 12; m++) {
      var key = currentYear + '-' + String(m).padStart(2, '0');
      months[key] = { key: key, label: m + '月' };
    }

    if (records && records.length > 0) {
      records.forEach(function (r) {
        if (r.date) {
          var d = new Date(r.date);
          var y2 = d.getFullYear();
          var m2 = d.getMonth() + 1;
          var key = y2 + '-' + String(m2).padStart(2, '0');
          if (!months[key]) {
            months[key] = { key: key, label: y2 + '年' + m2 + '月' };
          }
        }
      });
    }

    var list = [];
    Object.keys(months).sort().forEach(function (k) {
      list.push(months[k]);
    });
    return list;
  }

  // ============ 前端导出（SheetJS） ============

  function exportToExcel(records, customers, options) {
    options = options || {};
    return loadXLSX().then(function (XLSX) {
      var wb = XLSX.utils.book_new();

      // Sheet 1: 总资产摘要
      var periods = generateMonthlyPeriods(records);
      var summary = buildSummaryTable(records, customers, periods);
      var wsSummary = XLSX.utils.aoa_to_sheet([summary.headers].concat(summary.rows));
      setColumnWidths(wsSummary, summary.headers);
      XLSX.utils.book_append_sheet(wb, wsSummary, '总资产摘要');

      // Sheet 2: 资产明细
      var detailHeaders = ['客户', '客户ID', '资产类型', '资产名称', '资产价值', '前期价值', '变化率', '记录日期', '状态', '备注'];
      var detailRows = records.map(function (r) {
        var customer = customers[r.customerId] || {};
        var changeRate = r.previousValue && r.previousValue > 0
          ? ((r.value - r.previousValue) / r.previousValue * 100).toFixed(2) + '%'
          : '';
        return [
          customer.name || '',
          customer.code || '',
          ASSET_TYPE_LABELS[r.type] || r.type,
          r.name || '',
          r.value || 0,
          r.previousValue || '',
          changeRate,
          r.date || '',
          STATUS_LABELS[r.status] || r.status,
          r.note || ''
        ];
      });
      var wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders].concat(detailRows));
      setColumnWidths(wsDetail, detailHeaders);
      XLSX.utils.book_append_sheet(wb, wsDetail, '资产明细');

      // Sheet 3: 按客户汇总
      var customerSummaries = buildCustomerSummaries(records, customers);
      var cHeaders = ['客户', '客户ID', '资产类型', '总价值', '记录数', '平均变化率'];
      var cRows = customerSummaries.map(function (s) {
        return [s.name, s.code, s.type, s.totalValue, s.count, s.avgRate];
      });
      var wsCustomer = XLSX.utils.aoa_to_sheet([cHeaders].concat(cRows));
      setColumnWidths(wsCustomer, cHeaders);
      XLSX.utils.book_append_sheet(wb, wsCustomer, '客户汇总');

      var filename = (options.filename || '资产分配记录表') + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
      XLSX.writeFile(wb, filename);
      return { success: true, filename: filename };
    });
  }

  function buildCustomerSummaries(records, customers) {
    var map = {};
    records.forEach(function (r) {
      var key = r.customerId + '|' + r.type;
      if (!map[key]) {
        map[key] = {
          customerId: r.customerId,
          name: (customers[r.customerId] || {}).name || '未知',
          code: (customers[r.customerId] || {}).code || '',
          type: ASSET_TYPE_LABELS[r.type] || r.type,
          totalValue: 0,
          count: 0,
          changes: []
        };
      }
      map[key].totalValue += (r.value || 0);
      map[key].count += 1;
      if (r.previousValue && r.previousValue > 0) {
        map[key].changes.push((r.value - r.previousValue) / r.previousValue);
      }
    });

    return Object.keys(map).map(function (k) {
      var s = map[k];
      var avgRate = '';
      if (s.changes.length > 0) {
        avgRate = (s.changes.reduce(function (a, b) { return a + b; }, 0) / s.changes.length * 100).toFixed(2) + '%';
      }
      return { name: s.name, code: s.code, type: s.type, totalValue: s.totalValue, count: s.count, avgRate: avgRate };
    });
  }

  function setColumnWidths(ws, headers) {
    ws['!cols'] = headers.map(function (h) {
      return { wch: Math.max(String(h).length * 2, 15) };
    });
  }

  // ============ 前端导入（SheetJS） ============

  function importFromExcel(file, options) {
    options = options || {};
    return loadXLSX().then(function (XLSX) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var data = new Uint8Array(e.target.result);
            var wb = XLSX.read(data, { type: 'array' });
            var result = { sheets: {}, allRecords: [] };

            wb.SheetNames.forEach(function (name) {
              var ws = wb.Sheets[name];
              var json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
              if (json.length > 0) {
                result.sheets[name] = json;
                var parsed = parseSheetRecords(json, name, options);
                result.allRecords = result.allRecords.concat(parsed);
              }
            });

            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });
  }

  var SHEET_KEYWORD_MAP = {
    '摘要': 'summary',
    '总资产': 'summary',
    '明细': 'detail',
    '记录': 'detail',
    '客户': 'customer',
    '汇总': 'customer',
    '投资': 'investment',
    '收益': 'investment',
    '月': 'monthly'
  };

  function parseSheetRecords(json, sheetName, options) {
    if (json.length < 2) return [];

    var lowerName = sheetName.toLowerCase();
    var sheetType = 'detail';
    Object.keys(SHEET_KEYWORD_MAP).forEach(function (kw) {
      if (lowerName.indexOf(kw) !== -1) {
        sheetType = SHEET_KEYWORD_MAP[kw];
      }
    });

    // 跳过说明表
    if (lowerName.indexOf('说明') !== -1 || lowerName.indexOf('help') !== -1) {
      return [];
    }

    var headers = json[0];
    var records = [];
    var typeMap = buildReverseMap(ASSET_TYPE_LABELS);
    var statusMap = buildReverseMap(STATUS_LABELS);

    for (var i = 1; i < json.length; i++) {
      var row = json[i];
      if (!row || row.length === 0) continue;
      if (isEmptyRow(row)) continue;

      if (sheetType === 'summary') {
        var sr = parseSummaryRow(row, headers, typeMap);
        if (sr) records.push(sr);
      } else {
        var dr = parseDetailRow(row, headers, typeMap, statusMap, options);
        if (dr) records.push(dr);
      }
    }

    return records;
  }

  function parseDetailRow(row, headers, typeMap, statusMap, options) {
    var record = {
      customerId: '',
      type: 'other',
      name: '',
      value: 0,
      previousValue: null,
      date: '',
      status: 'valid',
      note: ''
    };

    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i]).trim();
      var v = row[i];

      if (h.indexOf('客户') !== -1 && h.indexOf('ID') === -1) record._customerName = String(v || '').trim();
      if (h.indexOf('客户ID') !== -1 || (h.indexOf('ID') !== -1 && h.indexOf('客户') !== -1)) {
        record.customerId = String(v || '').trim();
      }
      if (h.indexOf('资产类型') !== -1 || h === '类型') record.type = typeMap[String(v || '').trim()] || 'other';
      if (h.indexOf('资产名称') !== -1 || h === '名称') record.name = String(v || '').trim();
      if (h.indexOf('资产价值') !== -1 || h === '价值' || h.indexOf('金额') !== -1) {
        var n = parseFloat(v);
        record.value = isNaN(n) ? 0 : n;
      }
      if (h.indexOf('前期') !== -1 || h.indexOf('上期') !== -1) {
        var p = parseFloat(v);
        record.previousValue = isNaN(p) ? null : p;
      }
      if (h.indexOf('日期') !== -1 || h.indexOf('记录日期') !== -1) record.date = String(v || '').trim();
      if (h.indexOf('状态') !== -1) {
        var sv = statusMap[String(v || '').trim()];
        if (sv) record.status = sv;
      }
      if (h.indexOf('备注') !== -1 || h.indexOf('说明') !== -1) record.note = String(v || '').trim();
    }

    if (options.customerMap && record._customerName) {
      var matched = findCustomerByName(options.customerMap, record._customerName);
      if (matched) record.customerId = String(matched.id);
    }

    // 降低条件，只要有值就算有效
    if (record.value > 0 || record.name) {
      console.log('[Import] Parsed row:', record);
      return record;
    }

    return null;
  }

  function parseSummaryRow(row, headers, typeMap) {
    return null;
  }

  function findCustomerByName(customerMap, name) {
    var keys = Object.keys(customerMap);
    for (var i = 0; i < keys.length; i++) {
      var c = customerMap[keys[i]];
      if (c.name === name || c.shortName === name) return c;
    }
    return null;
  }

  function buildReverseMap(map) {
    var rev = {};
    Object.keys(map).forEach(function (k) {
      rev[map[k]] = k;
    });
    return rev;
  }

  function isEmptyRow(row) {
    return row.every(function (cell) { return cell === '' || cell === null || cell === undefined; });
  }

  // ============ 后端 API 调用 ============

  function backendExport(exportType, options) {
    options = options || {};
    var url = '/api/export/excel?type=' + (exportType || 'full');
    if (options.customerId) url += '&customerId=' + options.customerId;
    if (options.startDate) url += '&startDate=' + options.startDate;
    if (options.endDate) url += '&endDate=' + options.endDate;

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('导出失败: ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var filename = (options.filename || '资产分配记录表_后端导出') + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
        downloadBlob(blob, filename);
        return { success: true, filename: filename };
      });
  }

  function backendImport(file, options) {
    var formData = new FormData();
    formData.append('file', file);

    return fetch('/api/import/excel', {
      method: 'POST',
      body: formData
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        return result;
      });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============ 公开 API ============

  return {
    ASSET_TYPE_LABELS: ASSET_TYPE_LABELS,
    STATUS_LABELS: STATUS_LABELS,

    exportToExcel: exportToExcel,
    importFromExcel: importFromExcel,

    backendExport: backendExport,
    backendImport: backendImport,

    buildSummaryTable: buildSummaryTable,
    buildCustomerSummaries: buildCustomerSummaries,

    loadXLSX: loadXLSX
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinanceExcel;
}