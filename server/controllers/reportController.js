import Student from '../models/Student.js';
import Report from '../models/Report.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { generateStudentReportPDF } from '../services/pdfService.js';
import { getSubjectWiseMarks } from '../services/analyticsService.js';

export const generateStudentReport = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.studentId)
    .populate('user', 'name email')
    .populate('class', 'name section');

  if (!student) throw new AppError('Student not found', 404);

  const subjectMarks = await getSubjectWiseMarks(student._id);

  const report = await Report.create({
    title: `Student Report - ${student.rollNo}`,
    type: 'student',
    generatedBy: req.user._id,
    student: student._id,
    status: 'completed',
    metadata: { subjectMarks },
  });

  generateStudentReportPDF(res, {
    student,
    user: student.user,
    stats: { subjects: subjectMarks },
  });
});

export const getReports = catchAsync(async (req, res) => {
  const reports = await Report.find()
    .populate('generatedBy', 'name')
    .populate('student', 'rollNo')
    .sort('-createdAt')
    .limit(50);

  res.json({ success: true, data: { reports } });
});
