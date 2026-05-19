import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';

export const getAIInsights = async (classId) => {
  const filter = classId ? { class: classId } : {};
  const students = await Student.find(filter).populate('user', 'name');

  const weakStudents = students.filter((s) => s.gpa < 2.5);
  const lowAttendance = students.filter((s) => s.attendancePercentage < 75);
  const topPerformers = [...students].sort((a, b) => b.gpa - a.gpa).slice(0, 5);

  const suggestions = [];
  if (weakStudents.length) {
    suggestions.push(
      `${weakStudents.length} student(s) have GPA below 2.5. Consider remedial classes.`
    );
  }
  if (lowAttendance.length) {
    suggestions.push(
      `${lowAttendance.length} student(s) have attendance below 75%. Send parent alerts.`
    );
  }

  return {
    weakStudents: weakStudents.map((s) => ({
      id: s._id,
      name: s.user?.name,
      rollNo: s.rollNo,
      gpa: s.gpa,
    })),
    lowAttendance: lowAttendance.map((s) => ({
      id: s._id,
      name: s.user?.name,
      rollNo: s.rollNo,
      attendance: s.attendancePercentage,
    })),
    topPerformers: topPerformers.map((s) => ({
      id: s._id,
      name: s.user?.name,
      rollNo: s.rollNo,
      gpa: s.gpa,
    })),
    suggestions,
    predictedAtRisk: [...new Set([...weakStudents, ...lowAttendance])].map((s) => s._id),
  };
};

export const getAttendanceTrends = async (classId, months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const match = { date: { $gte: startDate } };
  if (classId) match.class = classId;

  return Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

export const getSubjectWiseMarks = async (studentId) => {
  return Result.aggregate([
    { $match: { student: studentId } },
    {
      $group: {
        _id: '$subject',
        avgMarks: { $avg: '$marks' },
        maxMarks: { $first: '$maxMarks' },
        count: { $sum: 1 },
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
    {
      $project: {
        name: '$subject.name',
        marks: { $round: ['$avgMarks', 1] },
        maxMarks: 1,
      },
    },
  ]);
};
