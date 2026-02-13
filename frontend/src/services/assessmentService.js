import api from './api.js';

export const assessmentService = {
  async startAssessment() {
    const res = await api.post('/assessments/start');
    return res.data;
  },

  async getQuestions(assessmentId) {
    const res = await api.get(`/assessments/${assessmentId}/questions`);
    return res.data;
  },

  async submitAssessment(assessmentId, responses) {
    const res = await api.post(`/assessments/${assessmentId}/submit`, { responses });
    return res.data;
  },

  async getResult(assessmentId) {
    const res = await api.get(`/assessments/${assessmentId}/result`);
    return res.data;
  },

  async getHistory() {
    const res = await api.get('/assessments/history');
    return res.data;
  },

  async downloadReport(assessmentId) {
    const res = await api.get(`/assessments/${assessmentId}/report`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
