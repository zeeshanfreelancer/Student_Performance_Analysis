export const PASS_MARK_THRESHOLD = 24;

export const getMaxMarksFromCredits = (credits = 3) => {
  const c = Number(credits) || 3;
  return c * 20;
};

export const calcSubjectPassStatus = (marks) => {
  if (marks === null || marks === undefined || marks === '') return null;
  const num = Number(marks);
  if (Number.isNaN(num)) return null;
  return num > PASS_MARK_THRESHOLD ? 'pass' : 'fail';
};

export const calcGradeFromMarks = (marks, maxMarks) => {
  if (!maxMarks) return '';
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A';
  if (pct >= 75) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};
