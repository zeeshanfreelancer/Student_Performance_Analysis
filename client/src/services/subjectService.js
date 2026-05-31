import api from './api';

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  assignTeacher: (id, teacherId) =>
    api.patch(`/subjects/${id}/assign-teacher`, { teacherId: teacherId || null }),
};
