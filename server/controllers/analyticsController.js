import Student from '../models/Student.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Assignment from '../models/Assignment.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  getAIInsights,
  getAttendanceTrends,
  getSubjectWiseMarks,
} from '../services/analyticsService.js';

export const getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalParents,
    activeUsers,
    students,
    pendingAssignments,
  ] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Teacher.countDocuments({ status: 'active' }),
    Parent.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'active' }),
    Student.find({ status: 'active' }).select('gpa attendancePercentage'),
    Assignment.countDocuments({ status: 'active', deadline: { $gte: new Date() } }),
  ]);

  const avgAttendance = students.length
    ? Math.round(students.reduce((a, s) => a + s.attendancePercentage, 0) / students.length)
    : 0;

  const topPerformers = [...students].sort((a, b) => b.gpa - a.gpa).slice(0, 5);
  const failedStudents = students.filter((s) => s.gpa < 2.0).length;

  res.json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalParents,
      activeUsers,
      attendancePercentage: avgAttendance,
      topPerformers,
      failedStudents,
      pendingAssignments,
    },
  });
});

export const getPerformanceAnalytics = catchAsync(async (req, res) => {
  const classId = req.query.class;
  const filter = classId ? { class: classId } : {};

  const [insights, attendanceTrends, semesterTrends, classAverages] = await Promise.all([
    getAIInsights(classId),
    getAttendanceTrends(classId),
    Result.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$semester',
          avgMarks: { $avg: '$marks' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Result.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$subject',
          avgMarks: { $avg: '$marks' },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$subject' },
      { $project: { name: '$subject.name', average: { $round: ['$avgMarks', 1] } } },
    ]),
  ]);

  const rankings = await Student.find(filter)
    .populate('user', 'name')
    .populate('class', 'name section')
    .sort('-gpa')
    .limit(20)
    .select('rollNo gpa attendancePercentage user class');

  res.json({
    success: true,
    data: {
      insights,
      attendanceTrends,
      semesterTrends,
      classAverages,
      rankings,
    },
  });
});

export const getStudentAnalytics = catchAsync(async (req, res) => {
  const subjectMarks = await getSubjectWiseMarks(req.params.studentId);
  const attendance = await Attendance.find({ student: req.params.studentId })
    .sort('-date')
    .limit(30);

  res.json({ success: true, data: { subjectMarks, attendance } });
});

export const getGrowthAnalytics = catchAsync(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [userGrowth, studentGrowth] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, role: '$role' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Student.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({ success: true, data: { userGrowth, studentGrowth } });
});
