import Student from '../models/Student.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import Assignment from '../models/Assignment.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  getAIInsights,
  getAttendanceTrends,
  getSubjectWiseMarks,
} from '../services/analyticsService.js';

const getTeacherScope = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId }).select('_id classes');
  if (!teacher) return { teacherId: null, classIds: [], studentFilter: { _id: null } };
  const classIds = teacher.classes || [];
  return {
    teacherId: teacher._id,
    classIds,
    studentFilter: classIds.length
      ? { status: 'active', class: { $in: classIds } }
      : { _id: null },
  };
};

export const getDashboardStats = catchAsync(async (req, res) => {
  const isTeacher = req.user.role === 'teacher';
  const scope = isTeacher ? await getTeacherScope(req.user._id) : null;

  const studentFilter = isTeacher ? scope.studentFilter : { status: 'active' };
  const assignmentFilter = isTeacher && scope.teacherId
    ? { teacher: scope.teacherId }
  : {};
  const openAssignmentFilter = {
    ...assignmentFilter,
    status: 'active',
    deadline: { $gte: new Date() },
  };

  const [
    studentProfileCount,
    teacherProfileCount,
    parentProfileCount,
    usersByRole,
    activeUsers,
    students,
    pendingAssignments,
    totalAssignments,
    totalAttendanceRecords,
  ] = await Promise.all([
    Student.countDocuments(studentFilter),
    isTeacher ? 0 : Teacher.countDocuments({ status: 'active' }),
    isTeacher ? 0 : Parent.countDocuments({ status: 'active' }),
    isTeacher
      ? Promise.resolve([])
      : User.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
    isTeacher ? 0 : User.countDocuments({ status: 'active' }),
    Student.find(studentFilter)
      .populate('user', 'name email')
      .populate('class', 'name section')
      .select('rollNo gpa attendancePercentage user class'),
    Assignment.countDocuments(openAssignmentFilter),
    Assignment.countDocuments(assignmentFilter),
    isTeacher && scope.classIds.length
      ? Attendance.countDocuments({ class: { $in: scope.classIds } })
      : Attendance.countDocuments(),
  ]);

  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r._id, r.count]));

  const totalStudents = studentProfileCount || (isTeacher ? 0 : roleCounts.student || 0);
  const totalTeachers = isTeacher ? 0 : teacherProfileCount || roleCounts.teacher || 0;
  const totalParents = isTeacher ? 0 : parentProfileCount || roleCounts.parent || 0;

  const avgAttendance = students.length
    ? Math.round(students.reduce((a, s) => a + (s.attendancePercentage || 0), 0) / students.length)
    : 0;

  const topPerformers = [...students]
    .sort((a, b) => (b.gpa || 0) - (a.gpa || 0))
    .slice(0, 5)
    .map((s) => ({
      _id: s._id,
      rollNo: s.rollNo,
      name: s.user?.name,
      email: s.user?.email,
      gpa: s.gpa,
      attendancePercentage: s.attendancePercentage,
      className: s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : '',
    }));

  const failedStudents = students.filter((s) => (s.gpa || 0) < 2.0).length;

  res.json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalParents,
      activeUsers: isTeacher ? students.length : activeUsers,
      attendancePercentage: avgAttendance,
      topPerformers,
      failedStudents,
      pendingAssignments,
      totalAssignments,
      totalAttendanceRecords,
      adminCount: isTeacher ? 0 : roleCounts.admin || 0,
      myClasses: isTeacher ? scope.classIds.length : undefined,
    },
  });
});

export const getPerformanceAnalytics = catchAsync(async (req, res) => {
  let classId = req.query.class;
  let classIds = null;

  if (req.user.role === 'teacher') {
    const scope = await getTeacherScope(req.user._id);
    classIds = scope.classIds;
    if (!classIds.length) {
      return res.json({
        success: true,
        data: {
          insights: { weakStudents: [], lowAttendance: [], topPerformers: [], suggestions: [] },
          attendanceTrends: [],
          semesterTrends: [],
          classAverages: [],
          rankings: [],
        },
      });
    }
    if (classId && !classIds.some((id) => id.toString() === classId)) {
      throw new AppError('You do not have permission', 403);
    }
    if (!classId) classIds = scope.classIds;
  }

  const studentFilter = classId
    ? { class: classId }
    : classIds?.length
      ? { class: { $in: classIds } }
      : {};

  const resultFilter = classId
    ? { class: classId }
    : classIds?.length
      ? { class: { $in: classIds } }
      : {};

  const [insights, attendanceTrends, semesterTrends, classAverages] = await Promise.all([
    getAIInsights(classId, classIds),
    getAttendanceTrends(classId, classIds),
    Result.aggregate([
      { $match: resultFilter },
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
      { $match: resultFilter },
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

  const rankings = await Student.find({ status: 'active', ...studentFilter })
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

  let studentMatch = { createdAt: { $gte: sixMonthsAgo } };
  if (req.user.role === 'teacher') {
    const scope = await getTeacherScope(req.user._id);
    studentMatch = scope.classIds.length
      ? { ...studentMatch, class: { $in: scope.classIds } }
      : { _id: null };
  }

  const [userGrowth, studentGrowth] = await Promise.all([
    req.user.role === 'teacher'
      ? Promise.resolve([])
      : User.aggregate([
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
      { $match: studentMatch },
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
