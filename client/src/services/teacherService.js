import api from './api';

export const teacherService = {
  getAll: () => api.get('/teachers'),
};
