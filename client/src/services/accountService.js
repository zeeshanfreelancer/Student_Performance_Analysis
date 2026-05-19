import api from './api';

export const accountService = {
  getCreatableRoles: () => api.get('/accounts/roles'),
  create: (data) => api.post('/accounts', data),
};
