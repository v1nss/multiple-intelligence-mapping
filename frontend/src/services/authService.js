import api from './api.js';

export const authService = {
  async register(data) {
    const res = await api.post('/api/auth/register', data);
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
};
