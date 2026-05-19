import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import { catchAsync } from '../utils/catchAsync.js';
import { exportToExcel, exportToCSV } from '../services/exportService.js';
import { generateStudentReportPDF } from '../services/pdfService.js';

export const exportStudents = catchAsync(async (req, res) => {
  const students = await Student.find()
    .populate('user', 'name email phone')
    .populate('class', 'name section')
    .populate('department', 'name');

  const data = students.map((s) => ({
    rollNo: s.rollNo,
    name: s.user?.name,
    email: s.user?.email,
    class: s.class?.name,
    department: s.department?.name,
    gpa: s.gpa,
    attendance: s.attendancePercentage,
    status: s.status,
  }));

  const columns = [
    { header: 'Roll No', key: 'rollNo', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Class', key: 'class', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'GPA', key: 'gpa', width: 10 },
    { header: 'Attendance %', key: 'attendance', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  const format = req.query.format || 'excel';
  if (format === 'csv') return exportToCSV(res, data, columns, 'students');
  return exportToExcel(res, data, columns, 'students');
});

export const exportAttendance = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.startDate && req.query.endDate) {
    filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
  }

  const records = await Attendance.find(filter)
    .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
    .populate('class', 'name section');

  const data = records.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    student: r.student?.user?.name,
    class: r.class?.name,
    status: r.status,
    remarks: r.remarks,
  }));

  const columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Student', key: 'student', width: 25 },
    { header: 'Class', key: 'class', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];

  const format = req.query.format || 'excel';
  if (format === 'csv') return exportToCSV(res, data, columns, 'attendance');
  return exportToExcel(res, data, columns, 'attendance');
});
