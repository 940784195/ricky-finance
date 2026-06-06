const Utils = {
    formatMoney(n) {
        if (n == null) return '¥0.00';
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 0
        }).format(n);
    },

    formatDate(d) {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString('zh-CN');
    },

    getRoleLabel(role) {
        const labels = {
            'admin': '系统管理员',
            'head': '户主',
            'member': '成员'
        };
        return labels[role] || role;
    },

    getStatusLabel(status) {
        const labels = {
            'valid': '有效',
            'pending': '待审核',
            'invalid': '无效'
        };
        return labels[status] || status;
    },

    getStatusBadgeClass(status) {
        const classes = {
            'valid': 'badge-success',
            'pending': 'badge-warning',
            'invalid': 'badge-danger'
        };
        return classes[status] || 'badge-info';
    },

    toast(message, type = 'success') {
        const container = document.querySelector('.toast-container') || (() => {
            const el = document.createElement('div');
            el.className = 'toast-container';
            document.body.appendChild(el);
            return el;
        })();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = type === 'success' ? '✓ ' : '✕ ';
        toast.innerHTML += message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    getShortName(name) {
        return name ? name.charAt(0) : '?';
    },

    debounce(fn, delay = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};

if (typeof module !== 'undefined') {
    module.exports = Utils;
}
