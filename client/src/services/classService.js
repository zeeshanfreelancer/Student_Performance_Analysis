import api from './api';

export const classService = {
  getAll: () => api.get('/classes'),
};
