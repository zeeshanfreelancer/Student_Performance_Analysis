export const PASS_MARK_THRESHOLD = 24;

export const getMaxMarksFromCredits = (credits = 3) => (Number(credits) || 3) * 20;

export const calcSubjectPassStatus = (marks) => {
  if (marks === null || marks === undefined || marks === '') return null;
  const num = Number(marks);
  if (Number.isNaN(num)) return null;
  return num > PASS_MARK_THRESHOLD ? 'pass' : 'fail';
};

export const passStatusLabel = (status) => (status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : '—');

export const passStatusClass = (status) =>
  status === 'pass'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : status === 'fail'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
