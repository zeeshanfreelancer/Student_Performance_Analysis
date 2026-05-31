import api from './api';

export const exportService = {
  monthlyAttendance: ({ year, month, class: classId, subject, format }) =>
    api.get('/export/attendance/monthly', {
      params: { year, month, class: classId || undefined, subject: subject || undefined, format },
      responseType: 'blob',
    }),
};
