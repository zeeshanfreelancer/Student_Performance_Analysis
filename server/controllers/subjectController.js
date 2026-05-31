import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import { syncSubjectTeacher } from '../services/subjectTeacherService.js';

const subjectPopulate = [
  { path: 'class', select: 'name section academicYear' },
  { path: 'department', select: 'name code' },
  {
    path: 'teacher',
    select: 'employeeId user',
    populate: { path: 'user', select: 'name email' },
  },
];

export const getSubjects = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  else if (req.user.role !== 'admin') filter.status = 'active';

  if (req.query.class) filter.class = req.query.class;

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id }).select('subjects');
    if (!teacher?.subjects?.length) {
      return res.json({ success: true, data: { subjects: [] } });
    }
    filter._id = { $in: teacher.subjects };
  } else if (req.query.teacher) {
    filter.teacher = req.query.teacher;
  }

  const subjects = await Subject.find(filter)
    .populate(subjectPopulate)
    .sort('class name');

  res.json({ success: true, data: { subjects } });
});

export const createSubject = catchAsync(async (req, res) => {
  const { name, code, class: classId, department, credits } = req.body;

  if (!name?.trim() || !code?.trim() || !classId) {
    throw new AppError('Name, code, and class are required', 400);
  }

  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new AppError('Class not found', 404);

  const normalizedCode = code.trim().toUpperCase();
  const exists = await Subject.findOne({ class: classId, code: normalizedCode });
  if (exists) throw new AppError('This subject code already exists for this class', 400);

  const subject = await Subject.create({
    name: name.trim(),
    code: normalizedCode,
    class: classId,
    department: department || classDoc.department || undefined,
    credits: credits || 3,
    status: 'active',
  });

  const populated = await Subject.findById(subject._id).populate(subjectPopulate);

  await logActivity(req.user._id, 'CREATE_SUBJECT', {
    resource: 'Subject',
    resourceId: subject._id,
  });

  res.status(201).json({ success: true, data: { subject: populated } });
});

export const updateSubject = catchAsync(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);

  const { name, code, class: classId, credits, status } = req.body;

  if (name !== undefined) subject.name = name.trim();
  if (credits !== undefined) subject.credits = credits;
  if (status !== undefined) subject.status = status;

  if (code !== undefined) {
    const normalizedCode = code.trim().toUpperCase();
    const targetClass = classId || subject.class;
    const duplicate = await Subject.findOne({
      class: targetClass,
      code: normalizedCode,
      _id: { $ne: subject._id },
    });
    if (duplicate) throw new AppError('This subject code already exists for this class', 400);
    subject.code = normalizedCode;
  }

  if (classId && classId.toString() !== subject.class.toString()) {
    const classDoc = await Class.findById(classId);
    if (!classDoc) throw new AppError('Class not found', 404);

    if (subject.teacher) {
      const stillInOldClass = await Subject.countDocuments({
        teacher: subject.teacher,
        class: subject.class,
        _id: { $ne: subject._id },
        status: 'active',
      });
      if (!stillInOldClass) {
        await Teacher.findByIdAndUpdate(subject.teacher, {
          $pull: { classes: subject.class },
        });
      }
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $addToSet: { classes: classId },
      });
    }
    subject.class = classId;
    if (!subject.department && classDoc.department) {
      subject.department = classDoc.department;
    }
  }

  await subject.save();

  const populated = await Subject.findById(subject._id).populate(subjectPopulate);

  res.json({ success: true, data: { subject: populated } });
});

export const deleteSubject = catchAsync(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);

  if (subject.teacher) {
    await syncSubjectTeacher(subject._id, null);
  }

  await Subject.findByIdAndDelete(subject._id);

  await logActivity(req.user._id, 'DELETE_SUBJECT', {
    resource: 'Subject',
    resourceId: subject._id,
  });

  res.json({ success: true, message: 'Subject deleted' });
});

export const assignSubjectTeacher = catchAsync(async (req, res) => {
  const { teacherId } = req.body;

  await syncSubjectTeacher(req.params.id, teacherId || null);

  const populated = await Subject.findById(req.params.id).populate(subjectPopulate);

  await logActivity(req.user._id, 'ASSIGN_SUBJECT_TEACHER', {
    resource: 'Subject',
    resourceId: req.params.id,
    metadata: { teacherId },
  });

  res.json({ success: true, data: { subject: populated } });
});
