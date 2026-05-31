import api from './api';

export const resultService = {
  getSubjectMarks: (subjectId) => api.get(`/results/subject/${subjectId}`),
  saveSubjectMarks: (subjectId, records) =>
    api.post(`/results/subject/${subjectId}`, { records }),
};
