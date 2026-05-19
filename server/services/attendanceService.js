import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

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
