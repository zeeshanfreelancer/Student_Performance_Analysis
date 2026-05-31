import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

/** Parse YYYY-MM-DD in local time (avoids UTC shift from query strings). */
export const parseAttendanceDate = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
    const [y, m, day] = String(dateStr).split('-').map(Number);
    return new Date(y, m - 1, day, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** First day attendance counts from (admin registration / enrollment). */
export const getStudentEnrollmentStart = (student) => {
  const timelineEnrollment = student.academicTimeline?.find((e) => e.type === 'enrollment')?.date;
  const raw = student.enrollmentDate || timelineEnrollment || student.createdAt;
  const start = new Date(raw);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const calcAttendancePercentage = (records) => {
  if (!records.length) return 0;
  const present = records.filter((r) => ['present', 'late'].includes(r.status)).length;
  return Math.round((present / records.length) * 100);
};

export const recalculateAttendancePercentage = async (studentId) => {
  const records = await Attendance.find({ student: studentId });
  if (!records.length) return 0;

  const present = records.filter((r) =>
    ['present', 'late'].includes(r.status)
  ).length;
  const percentage = Math.round((present / records.length) * 100);

  await Student.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
  return percentage;
};

export const getMonthlyAttendanceStats = async (studentId, year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    student: studentId,
    date: { $gte: start, $lte: end },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const leave = records.filter((r) => r.status === 'leave').length;

  return {
    total,
    present,
    absent,
    late,
    leave,
    percentage: total ? Math.round(((present + late) / total) * 100) : 0,
  };
};
