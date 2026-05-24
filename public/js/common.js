/**
 * 资产管家 - 公共工具模块
 * 所有页面共享的基础函数、常量和工具方法
 */
var RickyFinance = (function () {
  'use strict';

  var ASSET_TYPE_MAP = {
    stock: '股票',
    fund: '基金',
    bond: '债券',
    realestate: '房地产',
    cash: '现金',
    other: '其他'
  };

  var ASSET_TYPE_COLORS = {
    stock: '#f59e0b',
    fund: '#3b82f6',
    bond: '#10b981',
    realestate: '#ec4899',
    cash: '#6366f1',
    other: '#6b7280'
  };

  var STATUS_LABELS = {
    valid: '有效',
    pending: '待审核',
    invalid: '无效'
  };

  function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '\u00a5 0';
    return '\u00a5 ' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toLocaleString('zh-CN');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '/' + m + '/' + day;
  }

  function calculateChangeRate(current, previous) {
    if (!previous || previous <= 0) return '0%';
    var rate = ((current - previous) / previous * 100).toFixed(1);
    return (rate >= 0 ? '+' : '') + rate + '%';
  }

  function isChangePositive(current, previous) {
    if (!previous || previous <= 0) return true;
    return current >= previous;
  }

  function getStatusIcon(status) {
    if (status === 'valid') return 'check-circle';
    if (status === 'pending') return 'clock';
    return 'times-circle';
  }

  function getStatusClass(status) {
    if (status === 'valid') return 'positive';
    if (status === 'pending') return 'pending';
    return 'negative';
  }

  function getAssetTypeLabel(type) {
    return ASSET_TYPE_MAP[type] || type || '其他';
  }

  function getAssetTypeColor(type) {
    return ASSET_TYPE_COLORS[type] || ASSET_TYPE_COLORS.other;
  }

  // ============ Toast 通知 ============

  function showToast(type, message) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toastId = 'toast_' + Date.now();

    var iconMap = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.id = toastId;
    toast.innerHTML =
      '<i class="fas fa-' + (iconMap[type] || 'info-circle') + '"></i>' +
      '<span class="toast-message">' + message + '</span>' +
      '<button class="toast-close" onclick="RickyFinance.removeToast(\'' + toastId + '\')"><i class="fas fa-times"></i></button>';

    container.appendChild(toast);

    setTimeout(function () {
      var el = document.getElementById(toastId);
      if (el) {
        el.classList.add('slide-out');
        setTimeout(function () { RickyFinance.removeToast(toastId); }, 200);
      }
    }, 3500);
  }

  function removeToast(id) {
    var toast = document.getElementById(id);
    if (toast) toast.remove();
  }

  // ============ 认证相关 Toast ============
  function showAuthToast(message, type) {
    var existing = document.querySelector('.auth-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'auth-toast auth-toast-' + type;
    toast.innerHTML = '<i class="fa-solid fa-' + (type === 'success' ? 'circle-check' : 'circle-exclamation') + '"></i>' + message;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  // ============ 导航 ============
  function navigateTo(page) {
    if (page === 'overview') {
      window.location.href = 'index.html';
    } else if (page === 'customers') {
      window.location.href = 'customers.html';
    } else if (page === 'records') {
      window.location.href = 'asset-records.html';
    } else if (page === 'analysis') {
      window.location.href = 'asset-records.html?tab=analysis';
    } else if (page === 'export') {
      showToast('info', '报表导出功能开发中...');
    } else if (page === 'settings') {
      showToast('info', '系统设置功能开发中...');
    }
  }

  // ============ Modal 工具 ============

  function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // ============ API 客户端 ============

  function apiGet(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function apiPost(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function apiPut(url, data) {
    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function apiDelete(url) {
    return fetch(url, { method: 'DELETE' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // ============ 状态徽章 HTML ============

  function renderStatusBadge(status) {
    var label = STATUS_LABELS[status] || status;
    return '<span class="record-status ' + status + '">' +
      '<i class="fas fa-' + getStatusIcon(status) + '"></i> ' + label +
      '</span>';
  }

  // ============ 认证存储 ============
  function saveAuth(token, user) {
    localStorage.setItem('finance_token', token);
    localStorage.setItem('finance_user', JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem('finance_token');
    localStorage.removeItem('finance_user');
  }

  function getAuth() {
    var token = localStorage.getItem('finance_token');
    var userJson = localStorage.getItem('finance_user');
    return {
      token: token,
      user: userJson ? JSON.parse(userJson) : null
    };
  }

  function redirectToApp() {
    window.location.href = window.location.origin + '/asset-records.html';
  }

  // ============ 公开 API ============

  return {
    ASSET_TYPE_MAP: ASSET_TYPE_MAP,
    ASSET_TYPE_COLORS: ASSET_TYPE_COLORS,
    STATUS_LABELS: STATUS_LABELS,

    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    formatDate: formatDate,
    calculateChangeRate: calculateChangeRate,
    isChangePositive: isChangePositive,
    getStatusIcon: getStatusIcon,
    getStatusClass: getStatusClass,
    getAssetTypeLabel: getAssetTypeLabel,
    getAssetTypeColor: getAssetTypeColor,

    showToast: showToast,
    removeToast: removeToast,
    showAuthToast: showAuthToast,
    navigateTo: navigateTo,
    openModal: openModal,
    closeModal: closeModal,

    saveAuth: saveAuth,
    clearAuth: clearAuth,
    getAuth: getAuth,
    redirectToApp: redirectToApp,

    apiGet: apiGet,
    apiPost: apiPost,
    apiPut: apiPut,
    apiDelete: apiDelete,

    renderStatusBadge: renderStatusBadge
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RickyFinance;
}