/**
 * 资产管家 - 导出 / 导入 API 路由
 * 前端页面调用这些接口进行 Excel 的生成和解析
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const RECORDS_FILE = path.join(__dirname, '..', 'data', 'records.json');
const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

let excelService = null;
try {
  excelService = require('../services/excel-service');
} catch (e) {
  console.warn('ExcelJS 服务未安装（exceljs），后端样式导出不可用。请运行: npm install');
}

// ============ 导出 API ============

router.get('/export/excel', async (req, res) => {
  if (!excelService) {
    return res.status(503).json({
      success: false,
      message: 'ExcelJS 未安装，请运行 npm install 安装依赖后重试。前端导出仍可通过页面按钮使用。'
    });
  }

  try {
    const { customerId, startDate, endDate, type: exportType } = req.query;
    let records = readJSON(RECORDS_FILE);
    const customers = readJSON(CUSTOMERS_FILE);

    const customerMap = {};
    customers.forEach(c => { customerMap[c.id] = c; });

    if (customerId) records = records.filter(r => String(r.customerId) === String(customerId));
    if (startDate) records = records.filter(r => r.date >= startDate);
    if (endDate) records = records.filter(r => r.date <= endDate);

    const wb = await excelService.generateWorkbook(records, customerMap, {
      type: exportType || 'full'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent('资产分配记录表_后端导出.xlsx') + '"');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出失败:', err);
    res.status(500).json({ success: false, message: '导出失败: ' + err.message });
  }
});

// ============ 导入 API（multer 文件上传） ============

let multer = null;
let upload = null;
try {
  multer = require('multer');
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
        cb(null, true);
      } else {
        cb(new Error('仅支持 .xlsx / .xls / .csv 格式文件'));
      }
    }
  });
} catch (e) {
  console.warn('multer 未安装，文件上传导入不可用。请运行: npm install');
}

router.post('/import/excel', (req, res) => {
  if (!upload) {
    return res.status(503).json({
      success: false,
      message: 'multer 未安装，请运行 npm install 安装依赖。前端导入仍可通过页面按钮使用。'
    });
  }

  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    try {
      let records;

      if (excelService) {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(req.file.buffer);

        records = [];
        const customers = readJSON(CUSTOMERS_FILE);
        const customerMap = {};
        customers.forEach(c => { customerMap[String(c.id)] = c; });
        const customerNameMap = {};
        customers.forEach(c => { customerNameMap[c.name] = c; });

        wb.worksheets.forEach(ws => {
          const name = ws.name.toLowerCase();
          if (name.includes('摘要') || name.includes('汇总')) return;
          if (name.includes('kutools') || name.includes('提示')) return;

          ws.eachRow((row, rowNumber) => {
            if (rowNumber <= 4) return; // 跳过表头
            const vals = row.values.slice(1); // ExcelJS row.values[0] 是 undefined

            // 月度明细格式: 日期 | PO# | 汇率 | 币种 | 金额 | 类别 | 描述 | 分类
            const value = parseFloat(vals[4]) || 0;
            const categoryName = String(vals[5] || '').trim();
            const note = String(vals[6] || '').trim();
            const typeStr = String(vals[7] || '').trim();

            if (!value && !categoryName) return;

            const matchedCustomer = customerNameMap[categoryName];
            const type = reverseLabel(excelService.ASSET_TYPE_LABELS, typeStr) || 'other';

            records.push({
              customerId: matchedCustomer ? String(matchedCustomer.id) : '',
              type: type,
              name: categoryName,
              value: value,
              previousValue: null,
              date: vals[0] ? formatDateVal(vals[0]) : '',
              status: 'valid',
              note: note,
              _importedCategory: categoryName
            });
          });
        });

        // 过滤无效记录
        records = records.filter(r => r.value > 0 || r._importedCategory);
      } else {
        // 无 ExcelJS 时用简易 CSV 解析
        const content = req.file.buffer.toString('utf-8');
        records = parseSimpleCSV(content);
      }

      // 保存导入的记录
      if (records.length > 0) {
        const existingRecords = readJSON(RECORDS_FILE);
        const customers = readJSON(CUSTOMERS_FILE);

        records.forEach(r => {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          r.id = id;
          r.createdAt = new Date().toLocaleString('zh-CN');
          r.status = r.status || 'valid';
        });

        const merged = [...records, ...existingRecords];
        writeJSON(RECORDS_FILE, merged);
      }

      res.json({
        success: true,
        message: '导入成功',
        data: { imported: records.length, records: records }
      });
    } catch (parseErr) {
      console.error('导入解析失败:', parseErr);
      res.status(500).json({ success: false, message: '文件解析失败: ' + parseErr.message });
    }
  });
});

// ============ 简易 CSV 解析（无 ExcelJS 回退） ============

function parseSimpleCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length === 0) continue;

    const record = {
      customerId: '',
      type: 'other',
      name: '',
      value: 0,
      previousValue: null,
      date: '',
      status: 'valid',
      note: ''
    };

    headers.forEach((h, idx) => {
      const v = (vals[idx] || '').trim();
      if (h.includes('客户ID')) record.customerId = v;
      if (h.includes('客户') && !h.includes('ID')) record.name = v;
      if (h.includes('类型')) record.type = reverseLabel({ stock: '股票', fund: '基金', bond: '债券', realestate: '房地产', cash: '现金', other: '其他' }, v) || 'other';
      if (h.includes('名称')) record.name = record.name || v;
      if (h.includes('价值') || h.includes('金额')) record.value = parseFloat(v.replace(/[¥,]/g, '')) || 0;
      if (h.includes('日期')) record.date = v;
      if (h.includes('状态')) {
        const statusMap = { '有效': 'valid', '待审核': 'pending', '无效': 'invalid' };
        record.status = statusMap[v] || 'valid';
      }
      if (h.includes('备注')) record.note = v;
    });

    if (record.value > 0 || record.date) {
      records.push(record);
    }
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function reverseLabel(labelMap, label) {
  const entry = Object.entries(labelMap).find(([, v]) => v === label);
  return entry ? entry[0] : null;
}

function formatDateVal(val) {
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    // Excel 日期序列号
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  return String(val).trim();
}

module.exports = router;