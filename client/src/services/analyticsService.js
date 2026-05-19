import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getGrowth: () => api.get('/analytics/growth'),
  getMy: () => api.get('/analytics/me'),
  getStudentAnalytics: (id) => api.get(`/analytics/student/${id}`),
};
