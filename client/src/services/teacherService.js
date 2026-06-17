import api from './api';

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  update: (id, data) => api.patch(`/teachers/${id}`, data),
  updateStatus: (id, status) => api.patch(`/teachers/${id}/status`, { status }),
};
