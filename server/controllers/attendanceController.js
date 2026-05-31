import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  recalculateAttendancePercentage,
  getMonthlyAttendanceStats,
  getStudentEnrollmentStart,
  calcAttendancePercentage,
  parseAttendanceDate,
} from '../services/attendanceService.js';
import { logActivity } from '../services/activityLogService.js';
import { assertParentOwnsStudent, getLinkedChildrenForUser } from '../services/parentLinkService.js';
import { assertTeacherOwnsSubject } from '../services/subjectAccessService.js';

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'leave'];

export const markAttendance = catchAsync(async (req, res) => {
  const { subject: subjectId, date, records } = req.body;
  if (!subjectId) throw new AppError('Subject is required', 400);
  if (!records?.length) throw new AppError('Attendance records required', 400);

  const subject = await assertTeacherOwnsSubject(req.user, subjectId);
  const classId = subject.class._id || subject.class;

  const studentsInClass = await Student.find({ class: classId, status: 'active' }).select('_id');
  const allowedIds = new Set(studentsInClass.map((s) => s._id.toString()));

  const attendanceDate = parseAttendanceDate(date);

  const results = [];
  for (const record of records) {
    if (!allowedIds.has(record.student?.toString())) {
      throw new AppError('One or more students do not belong to this subject\'s class', 400);
    }
    if (!ATTENDANCE_STATUSES.includes(record.status)) {
      throw new AppError(`Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`, 400);
    }
    const attendance = await Attendance.findOneAndUpdate(
      { student: record.student, subject: subjectId, date: attendanceDate },
      {
        student: record.student,
        subject: subjectId,
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
    metadata: { subjectId, classId, count: results.length },
  });

  res.json({ success: true, data: { attendance: results } });
});

export const getAttendanceBySubject = catchAsync(async (req, res) => {
  const subjectId = req.params.subjectId;
  const subject = await assertTeacherOwnsSubject(req.user, subjectId);
  const classId = subject.class._id || subject.class;

  const date = parseAttendanceDate(req.query.date);

  const [students, attendance] = await Promise.all([
    Student.find({ class: classId, status: 'active' })
      .populate('user', 'name')
      .sort('rollNo'),
    Attendance.find({ subject: subjectId, date }).populate({
      path: 'student',
      populate: { path: 'user', select: 'name' },
    }),
  ]);

  const attendanceByStudent = {};
  attendance.forEach((a) => {
    attendanceByStudent[a.student._id?.toString() || a.student.toString()] = a;
  });

  res.json({
    success: true,
    data: {
      subject,
      class: subject.class,
      date,
      students,
      attendance,
      attendanceByStudent,
    },
  });
});

export const getStudentAttendance = catchAsync(async (req, res) => {
  if (req.user.role === 'parent') {
    await assertParentOwnsStudent(req.user._id, req.params.studentId);
  }
  if (req.user.role === 'student') {
    const own = await Student.findOne({ user: req.user._id });
    if (!own || own._id.toString() !== req.params.studentId.toString()) {
      throw new AppError('You can only view your own attendance', 403);
    }
  }

  const student = await Student.findById(req.params.studentId);
  if (!student) throw new AppError('Student not found', 404);

  const enrolledFrom = getStudentEnrollmentStart(student);
  const filter = { student: req.params.studentId, date: { $gte: enrolledFrom } };
  if (req.query.startDate && req.query.endDate) {
    filter.date = {
      $gte: new Date(Math.max(new Date(req.query.startDate), enrolledFrom)),
      $lte: new Date(req.query.endDate),
    };
  } else if (req.query.startDate) {
    filter.date.$gte = new Date(Math.max(new Date(req.query.startDate), enrolledFrom));
  } else if (req.query.endDate) {
    filter.date.$lte = new Date(req.query.endDate);
  }

  const attendance = await Attendance.find(filter)
    .populate('subject', 'name code')
    .sort('-date');
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const monthly = await getMonthlyAttendanceStats(req.params.studentId, year, month);

  res.json({ success: true, data: { attendance, monthly, enrollmentDate: enrolledFrom } });
});

export const getAttendanceAnalytics = catchAsync(async (req, res) => {
  if (req.user.role === 'parent') {
    const { children } = await getLinkedChildrenForUser(req.user._id);
    const childIds = children.map((c) => c._id);

    if (!childIds.length) {
      return res.json({
        success: true,
        data: { lowAttendance: [], monthlyStats: [], calendar: [], classAverage: 0, children: [] },
      });
    }

    const lowAttendance = children.filter((s) => s.attendancePercentage < 75);
    const classAverage = children.length
      ? Math.round(children.reduce((a, s) => a + s.attendancePercentage, 0) / children.length)
      : 0;

    const monthlyStats = await Attendance.aggregate([
      { $match: { student: { $in: childIds } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const calendar = await Attendance.find({ student: { $in: childIds } })
      .sort('-date')
      .limit(90)
      .populate('subject', 'name code')
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } });

    return res.json({
      success: true,
      data: { lowAttendance, monthlyStats, calendar, classAverage, children },
    });
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'name');
    if (!student) throw new AppError('Student profile not found', 404);

    const enrolledFrom = getStudentEnrollmentStart(student);
    const dateMatch = { student: student._id, date: { $gte: enrolledFrom } };

    const monthlyStats = await Attendance.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const attendance = await Attendance.find(dateMatch)
      .populate('subject', 'name code')
      .sort('-date');
    const percentageSinceEnrollment = calcAttendancePercentage(attendance);

    return res.json({
      success: true,
      data: {
        lowAttendance: percentageSinceEnrollment < 75 ? [student] : [],
        monthlyStats,
        calendar: attendance,
        attendance,
        classAverage: percentageSinceEnrollment,
        enrollmentDate: enrolledFrom,
        student,
      },
    });
  }

  const classId = req.query.class;
  const subjectId = req.query.subject;
  const filter = {};
  if (subjectId) filter.subject = subjectId;
  else if (classId) filter.class = classId;

  const studentFilter = classId ? { class: classId } : {};
  const students = await Student.find(studentFilter).populate('user', 'name');
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
    .populate('subject', 'name code')
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
