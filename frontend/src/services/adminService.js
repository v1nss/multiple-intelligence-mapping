import api from './api.js';

export const adminService = {
  async getUsers(params = {}) {
    const res = await api.get('/api/admin/users', { params });
    return res.data;
  },

  async getAnalytics() {
    const res = await api.get('/api/admin/analytics');
    return res.data;
  },

  async getQuestions(params = {}) {
    const res = await api.get('/api/admin/questions', { params });
    return res.data;
  },

  async createQuestion(data) {
    const res = await api.post('/api/admin/questions', data);
    return res.data;
  },

  async updateQuestion(id, data) {
    const res = await api.put(`/api/admin/questions/${id}`, data);
    return res.data;
  },

  async deleteQuestion(id) {
    const res = await api.delete(`/api/admin/questions/${id}`);
    return res.data;
  },

  async getDomains() {
    const res = await api.get('/api/admin/domains');
    return res.data;
  },

  async getVersions() {
    const res = await api.get('/api/admin/versions');
    return res.data;
  },
};
