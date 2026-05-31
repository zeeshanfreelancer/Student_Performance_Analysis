import api from './api';

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  updateStatus: (id, status) => api.patch(`/teachers/${id}/status`, { status }),
};
