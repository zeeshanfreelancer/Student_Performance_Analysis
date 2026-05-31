import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';

const STATUS_SHORT = {
  present: 'P',
  absent: 'A',
  late: 'L',
  leave: 'LV',
};

const monthRange = (year, month) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = end.getDate();
  return { start, end, daysInMonth };
};

export const resolveExportClassIds = async (user, classId) => {
  if (user.role === 'admin') {
    if (classId) return [classId.toString()];
    const classes = await Class.find({ status: 'active' }).select('_id');
    return classes.map((c) => c._id.toString());
  }

  const teacher = await Teacher.findOne({ user: user._id }).select('classes');
  const allowed = (teacher?.classes || []).map((id) => id.toString());
  if (!allowed.length) throw new AppError('No classes assigned to you', 403);

  if (classId) {
    if (!allowed.includes(classId.toString())) {
      throw new AppError('You can only export attendance for your assigned classes', 403);
    }
    return [classId.toString()];
  }
  return allowed;
};

const buildClassSheet = async (classId, year, month) => {
  const { start, end, daysInMonth } = monthRange(year, month);

  const classDoc = await Class.findById(classId).select('name section academicYear');
  if (!classDoc) return null;

  const students = await Student.find({ class: classId, status: 'active' })
    .populate('user', 'name')
    .sort('rollNo');

  const records = await Attendance.find({
    class: classId,
    date: { $gte: start, $lte: end },
  });

  const byStudentDay = {};
  records.forEach((r) => {
    const sid = r.student.toString();
    const day = new Date(r.date).getDate();
    if (!byStudentDay[sid]) byStudentDay[sid] = {};
    byStudentDay[sid][day] = r.status;
  });

  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => ({
    header: String(i + 1),
    key: `d${i + 1}`,
    width: 5,
  }));

  const columns = [
    { header: 'Roll No', key: 'rollNo', width: 12 },
    { header: 'Name', key: 'name', width: 28 },
    ...dayColumns,
    { header: 'Present', key: 'present', width: 10 },
    { header: 'Absent', key: 'absent', width: 10 },
    { header: 'Attendance %', key: 'pct', width: 14 },
  ];

  const rows = students.map((s) => {
    const sid = s._id.toString();
    const dayMap = byStudentDay[sid] || {};
    let present = 0;
    let absent = 0;
    let marked = 0;

    const row = {
      rollNo: s.rollNo,
      name: s.user?.name || '—',
    };

    for (let d = 1; d <= daysInMonth; d += 1) {
      const status = dayMap[d];
      row[`d${d}`] = status ? STATUS_SHORT[status] || status : '-';
      if (status) {
        marked += 1;
        if (status === 'present' || status === 'late') present += 1;
        if (status === 'absent') absent += 1;
      }
    }

    row.present = present;
    row.absent = absent;
    row.pct = marked ? `${Math.round((present / marked) * 100)}%` : '—';
    return row;
  });

  const classLabel = `${classDoc.name} ${classDoc.section || ''}`.trim();
  const sheetName = classLabel.slice(0, 31).replace(/[\\/*?:[\]]/g, '');

  return {
    classId,
    classLabel,
    academicYear: classDoc.academicYear,
    sheetName: sheetName || 'Class',
    columns,
    rows,
    daysInMonth,
    year,
    month,
  };
};

export const resolveExportSubjectIds = async (user, subjectId) => {
  if (user.role === 'admin') {
    if (subjectId) return [subjectId.toString()];
    const subjects = await Subject.find({ status: 'active' }).select('_id');
    return subjects.map((s) => s._id.toString());
  }

  const teacher = await Teacher.findOne({ user: user._id }).select('subjects');
  const allowed = (teacher?.subjects || []).map((id) => id.toString());
  if (!allowed.length) throw new AppError('No subjects assigned to you', 403);

  if (subjectId) {
    if (!allowed.includes(subjectId.toString())) {
      throw new AppError('You can only export attendance for your assigned subjects', 403);
    }
    return [subjectId.toString()];
  }
  return allowed;
};

const buildSubjectSheet = async (subjectId, year, month) => {
  const { start, end, daysInMonth } = monthRange(year, month);

  const subject = await Subject.findById(subjectId)
    .populate('class', 'name section academicYear')
    .select('name code class');
  if (!subject?.class) return null;

  const classId = subject.class._id || subject.class;
  const students = await Student.find({ class: classId, status: 'active' })
    .populate('user', 'name')
    .sort('rollNo');

  const records = await Attendance.find({
    subject: subjectId,
    date: { $gte: start, $lte: end },
  });

  const byStudentDay = {};
  records.forEach((r) => {
    const sid = r.student.toString();
    const day = new Date(r.date).getDate();
    if (!byStudentDay[sid]) byStudentDay[sid] = {};
    byStudentDay[sid][day] = r.status;
  });

  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => ({
    header: String(i + 1),
    key: `d${i + 1}`,
    width: 5,
  }));

  const columns = [
    { header: 'Roll No', key: 'rollNo', width: 12 },
    { header: 'Name', key: 'name', width: 28 },
    ...dayColumns,
    { header: 'Present', key: 'present', width: 10 },
    { header: 'Absent', key: 'absent', width: 10 },
    { header: 'Attendance %', key: 'pct', width: 14 },
  ];

  const rows = students.map((s) => {
    const sid = s._id.toString();
    const dayMap = byStudentDay[sid] || {};
    let present = 0;
    let absent = 0;
    let marked = 0;

    const row = {
      rollNo: s.rollNo,
      name: s.user?.name || '—',
    };

    for (let d = 1; d <= daysInMonth; d += 1) {
      const status = dayMap[d];
      row[`d${d}`] = status ? STATUS_SHORT[status] || status : '-';
      if (status) {
        marked += 1;
        if (status === 'present' || status === 'late') present += 1;
        if (status === 'absent') absent += 1;
      }
    }

    row.present = present;
    row.absent = absent;
    row.pct = marked ? `${Math.round((present / marked) * 100)}%` : '—';
    return row;
  });

  const classLabel = `${subject.class.name} ${subject.class.section || ''}`.trim();
  const sheetName = `${subject.name}`.slice(0, 31).replace(/[\\/*?:[\]]/g, '');

  return {
    classId,
    classLabel: `${subject.name} (${classLabel})`,
    academicYear: subject.class.academicYear,
    sheetName: sheetName || 'Subject',
    columns,
    rows,
    daysInMonth,
    year,
    month,
  };
};

export const buildMonthlyAttendanceExport = async (user, { year, month, classId, subjectId }) => {
  const y = parseInt(year, 10) || new Date().getFullYear();
  const m = parseInt(month, 10) || new Date().getMonth() + 1;
  if (m < 1 || m > 12) throw new AppError('Month must be between 1 and 12', 400);

  const sheets = [];

  if (subjectId || user.role === 'teacher') {
    const subjectIds = await resolveExportSubjectIds(user, subjectId);
    for (const id of subjectIds) {
      const sheet = await buildSubjectSheet(id, y, m);
      if (sheet) sheets.push(sheet);
    }
  } else {
    const classIds = await resolveExportClassIds(user, classId);
    for (const id of classIds) {
      const sheet = await buildClassSheet(id, y, m);
      if (sheet) sheets.push(sheet);
    }
  }

  if (!sheets.length) {
    throw new AppError('No data found to export', 404);
  }

  const monthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' });

  return { year: y, month: m, monthName, sheets };
};
