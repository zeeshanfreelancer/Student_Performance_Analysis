import api from './api';

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
};
