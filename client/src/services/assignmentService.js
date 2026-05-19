import api from './api';

export const assignmentService = {
  getAll: (params) => api.get('/assignments', { params }),
  getMy: () => api.get('/assignments/my'),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) =>
    api.post('/assignments', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  update: (id, data) => api.patch(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, data) =>
    api.post(`/assignments/${id}/submit`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
};
