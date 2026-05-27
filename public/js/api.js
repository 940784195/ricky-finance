const API = {
    base: '',

    getToken() {
        return localStorage.getItem('token');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${this.base}${endpoint}`, {
            ...options,
            headers
        });

        if (res.status === 401) {
            this.logout();
            throw new Error('登录已过期');
        }

        return res.json();
    },

    async getStats() {
        return this.request('/api/stats');
    },

    async getRecords(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/records${query ? '?' + query : ''}`);
    },

    async createRecord(data) {
        return this.request('/api/records', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateRecord(id, data) {
        return this.request(`/api/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteRecord(id) {
        return this.request(`/api/records/${id}`, {
            method: 'DELETE'
        });
    },

    async getMembers() {
        return this.request('/api/members');
    },

    async getMember(id) {
        return this.request(`/api/members/${id}`);
    },

    async createMember(data) {
        return this.request('/api/members', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateMember(id, data) {
        return this.request(`/api/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteMember(id) {
        return this.request(`/api/members/${id}`, {
            method: 'DELETE'
        });
    },

    async getAssetTypes() {
        return this.request('/api/asset-types');
    },

    async createAssetType(data) {
        return this.request('/api/asset-types', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateAssetType(id, data) {
        return this.request(`/api/asset-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteAssetType(id) {
        return this.request(`/api/asset-types/${id}`, {
            method: 'DELETE'
        });
    },

    async getFamilies() {
        return this.request('/api/families');
    },

    async getFamily(id) {
        return this.request(`/api/families/${id}`);
    },

    exportCSV(params = {}) {
        const query = new URLSearchParams(params).toString();
        const token = this.getToken();
        const url = `/api/export/csv${query ? '?' + query : ''}`;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `${url}&token=${token}`;
        document.body.appendChild(iframe);

        setTimeout(() => iframe.remove(), 1000);
    }
};

if (typeof module !== 'undefined') {
    module.exports = API;
}
