import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  recalculateAttendancePercentage,
  getMonthlyAttendanceStats,
} from '../services/attendanceService.js';
import { logActivity } from '../services/activityLogService.js';

export const markAttendance = catchAsync(async (req, res) => {
  const { class: classId, date, records } = req.body;
  if (!records?.length) throw new AppError('Attendance records required', 400);

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];
  for (const record of records) {
    const attendance = await Attendance.findOneAndUpdate(
      { student: record.student, date: attendanceDate },
      {
        student: record.student,
        class: classId,
        date: attendanceDate,
        status: record.status,
        markedBy: req.user._id,
        remarks: record.remarks || '',
      },
      { upsert: true, new: true }
    );
    await recalculateAttendancePercentage(record.student);
    results.push(attendance);
  }

  await logActivity(req.user._id, 'MARK_ATTENDANCE', {
    resource: 'Attendance',
    metadata: { classId, count: results.length },
  });

  res.json({ success: true, data: { attendance: results } });
});

export const getAttendanceByClass = catchAsync(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  date.setHours(0, 0, 0, 0);

  const attendance = await Attendance.find({ class: req.params.classId, date })
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } });

  res.json({ success: true, data: { attendance } });
});

export const getStudentAttendance = catchAsync(async (req, res) => {
  const filter = { student: req.params.studentId };
  if (req.query.startDate && req.query.endDate) {
    filter.date = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const attendance = await Attendance.find(filter).sort('-date');
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const monthly = await getMonthlyAttendanceStats(req.params.studentId, year, month);

  res.json({ success: true, data: { attendance, monthly } });
});

export const getAttendanceAnalytics = catchAsync(async (req, res) => {
  const classId = req.query.class;
  const filter = classId ? { class: classId } : {};

  const students = await Student.find(filter).populate('user', 'name');
  const lowAttendance = students.filter((s) => s.attendancePercentage < 75);

  const monthlyStats = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, status: '$status' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const calendar = await Attendance.find(filter)
    .sort('-date')
    .limit(90)
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } });

  res.json({
    success: true,
    data: {
      lowAttendance,
      monthlyStats,
      calendar,
      classAverage:
        students.length
          ? Math.round(students.reduce((a, s) => a + s.attendancePercentage, 0) / students.length)
          : 0,
    },
  });
});
