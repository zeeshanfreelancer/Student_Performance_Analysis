import api from './api';

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getProfile: (id) => api.get(`/students/${id}/profile`),
  create: (data) =>
    api.post('/students', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  update: (id, data) =>
    api.patch(`/students/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  delete: (id) => api.delete(`/students/${id}`),
  advancedSearch: (params) => api.get('/students/search/advanced', { params }),
  export: (format) => api.get(`/export/students?format=${format}`, { responseType: 'blob' }),
};
