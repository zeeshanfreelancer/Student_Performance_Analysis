import Parent from '../models/Parent.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Assignment from '../models/Assignment.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { getMonthlyAttendanceStats } from '../services/attendanceService.js';
import { getSubjectWiseMarks } from '../services/analyticsService.js';

export const getParentDashboard = catchAsync(async (req, res) => {
  const parent = await Parent.findOne({ user: req.user._id }).populate({
    path: 'children',
    populate: [
      { path: 'user', select: 'name email profileImage' },
      { path: 'class', select: 'name section' },
    ],
  });

  if (!parent) throw new AppError('Parent profile not found', 404);

  const childrenData = await Promise.all(
    parent.children.map(async (child) => {
      const [monthly, subjectMarks, recentAttendance, results] = await Promise.all([
        getMonthlyAttendanceStats(child._id, new Date().getFullYear(), new Date().getMonth() + 1),
        getSubjectWiseMarks(child._id),
        Attendance.find({ student: child._id }).sort('-date').limit(10),
        Result.find({ student: child._id }).populate('subject', 'name').sort('-createdAt').limit(10),
      ]);

      const assignments = await Assignment.find({ class: child.class, status: 'active' });
      const alerts = [];
      if (child.attendancePercentage < 75) {
        alerts.push({ type: 'attendance', message: 'Low attendance alert' });
      }
      if (child.gpa < 2.5) {
        alerts.push({ type: 'performance', message: 'Academic performance needs attention' });
      }

      return {
        student: child,
        monthly,
        subjectMarks,
        recentAttendance,
        results,
        assignments: assignments.length,
        alerts,
      };
    })
  );

  res.json({ success: true, data: { parent, children: childrenData } });
});

export const getChildProfile = catchAsync(async (req, res) => {
  const parent = await Parent.findOne({ user: req.user._id });
  const student = await Student.findById(req.params.childId)
    .populate('user', 'name email phone profileImage')
    .populate('class', 'name section')
    .populate('department', 'name');

  if (!parent?.children.some((c) => c.toString() === req.params.childId)) {
    throw new AppError('Access denied', 403);
  }

  const [attendance, results, assignments, subjectMarks] = await Promise.all([
    Attendance.find({ student: student._id }).sort('-date').limit(30),
    Result.find({ student: student._id }).populate('subject', 'name'),
    Assignment.find({ class: student.class }),
    getSubjectWiseMarks(student._id),
  ]);

  res.json({
    success: true,
    data: { student, attendance, results, assignments, subjectMarks },
  });
});
