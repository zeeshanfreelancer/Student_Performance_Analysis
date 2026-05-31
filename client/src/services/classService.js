import api from './api';

export const classService = {
  getAll: (params) => api.get('/classes', { params }),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.patch(`/classes/${id}`, data),
  assignTeachers: (id, teacherIds) =>
    api.post(`/classes/${id}/assign-teacher`, { teacherIds }),
  delete: (id) => api.delete(`/classes/${id}`),
};
