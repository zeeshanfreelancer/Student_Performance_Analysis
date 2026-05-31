import api from './api';

export const parentService = {
  /** Parent portal (logged-in parent) */
  getDashboard: () => api.get('/parent/dashboard'),
  getChild: (childId) => api.get(`/parent/child/${childId}`),

  /** Admin / teacher: manage parent–student links */
  getAll: () => api.get('/parents'),
  getById: (id) => api.get(`/parents/${id}`),
  updateChildren: (id, children) => api.patch(`/parents/${id}/children`, { children }),
};
