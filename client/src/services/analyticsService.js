import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getGrowth: () => api.get('/analytics/growth'),
  getStudentAnalytics: (id) => api.get(`/analytics/student/${id}`),
};
