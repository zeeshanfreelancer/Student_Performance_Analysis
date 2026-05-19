import api from './api';

export const attendanceService = {
  mark: (data) => api.post('/attendance/mark', data),
  getByClass: (classId, date) => api.get(`/attendance/class/${classId}`, { params: { date } }),
  getByStudent: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getAnalytics: (params) => api.get('/attendance/analytics', { params }),
  export: (format, params) =>
    api.get(`/export/attendance?format=${format}`, { params, responseType: 'blob' }),
};
