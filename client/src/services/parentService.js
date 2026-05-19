import api from './api';

export const parentService = {
  getDashboard: () => api.get('/parent/dashboard'),
  getChild: (childId) => api.get(`/parent/child/${childId}`),
};
