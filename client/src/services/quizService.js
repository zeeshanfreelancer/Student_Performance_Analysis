import api from './api';

export const quizService = {
  getAll: (params) => api.get('/quizzes', { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  start: (id) => api.get(`/quizzes/${id}/start`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getLeaderboard: (id) => api.get(`/quizzes/${id}/leaderboard`),
  getHistory: () => api.get('/quizzes/history'),
  update: (id, data) => api.patch(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
};
