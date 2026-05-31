import Result from '../models/Result.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import { assertTeacherOwnsSubject } from '../services/subjectAccessService.js';
import { getMaxMarksFromCredits, calcGradeFromMarks, calcSubjectPassStatus } from '../utils/subjectMarks.js';

const SUBJECT_EXAM_TYPE = 'subject';
const DEFAULT_SEMESTER = 1;

export const getSubjectMarks = catchAsync(async (req, res) => {
  const subject = await assertTeacherOwnsSubject(req.user, req.params.subjectId);
  const classId = subject.class._id || subject.class;
  const maxMarks = getMaxMarksFromCredits(subject.credits);

  const students = await Student.find({ class: classId, status: 'active' })
    .populate('user', 'name')
    .sort('rollNo');

  const results = await Result.find({
    student: { $in: students.map((s) => s._id) },
    subject: subject._id,
    examType: SUBJECT_EXAM_TYPE,
    semester: DEFAULT_SEMESTER,
  });

  const marksByStudent = {};
  results.forEach((r) => {
    marksByStudent[r.student.toString()] = r;
  });

  res.json({
    success: true,
    data: {
      subject,
      maxMarks,
      passThreshold: 24,
      students: students.map((s) => {
        const result = marksByStudent[s._id.toString()] || null;
        return {
          ...s.toObject(),
          result: result
            ? {
                ...result.toObject(),
                passStatus: result.passed === false ? 'fail' : result.passed === true ? 'pass' : calcSubjectPassStatus(result.marks),
              }
            : null,
        };
      }),
    },
  });
});

export const saveSubjectMarks = catchAsync(async (req, res) => {
  const subject = await assertTeacherOwnsSubject(req.user, req.params.subjectId);
  const classId = subject.class._id || subject.class;
  const maxMarks = getMaxMarksFromCredits(subject.credits);
  const { records } = req.body;

  if (!records?.length) throw new AppError('Marks records required', 400);

  const studentsInClass = await Student.find({ class: classId, status: 'active' }).select('_id');
  const allowedIds = new Set(studentsInClass.map((s) => s._id.toString()));

  const saved = [];
  for (const record of records) {
    if (!allowedIds.has(record.student?.toString())) {
      throw new AppError('One or more students do not belong to this subject\'s class', 400);
    }

    const marks = Number(record.marks);
    if (Number.isNaN(marks) || marks < 0 || marks > maxMarks) {
      throw new AppError(`Marks must be between 0 and ${maxMarks}`, 400);
    }

    const passed = calcSubjectPassStatus(marks) === 'pass';

    const result = await Result.findOneAndUpdate(
      {
        student: record.student,
        subject: subject._id,
        examType: SUBJECT_EXAM_TYPE,
        semester: DEFAULT_SEMESTER,
      },
      {
        student: record.student,
        subject: subject._id,
        class: classId,
        semester: DEFAULT_SEMESTER,
        examType: SUBJECT_EXAM_TYPE,
        marks,
        maxMarks,
        grade: calcGradeFromMarks(marks, maxMarks),
        passed,
        recordedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    saved.push(result);
  }

  await logActivity(req.user._id, 'SAVE_SUBJECT_MARKS', {
    resource: 'Result',
    metadata: { subjectId: subject._id, count: saved.length },
  });

  res.json({ success: true, data: { results: saved, maxMarks } });
});
