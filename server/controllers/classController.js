import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';

const syncTeacherClassAssignment = async (classId, teacherId) => {
  if (!teacherId) return;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new AppError('Teacher not found', 404);

  const classIdStr = classId.toString();
  const previous = await Class.findById(classId).select('classTeacher');

  if (previous?.classTeacher && previous.classTeacher.toString() !== teacherId.toString()) {
    await Teacher.findByIdAndUpdate(previous.classTeacher, {
      $pull: { classes: classId },
    });
  }

  await Class.findByIdAndUpdate(classId, { classTeacher: teacherId });
  await Teacher.findByIdAndUpdate(teacherId, {
    $addToSet: { classes: classId },
  });
};

export const getClasses = catchAsync(async (req, res) => {
  let filter = {};

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id }).select('classes');
    if (!teacher?.classes?.length) {
      return res.json({ success: true, data: { classes: [] } });
    }
    filter = { _id: { $in: teacher.classes }, status: 'active' };
  } else if (req.user.role === 'admin') {
    if (req.query.status) filter.status = req.query.status;
    else filter.status = 'active';
  } else {
    filter.status = 'active';
  }

  const classes = await Class.find(filter)
    .populate('department', 'name code')
    .populate({
      path: 'classTeacher',
      select: 'employeeId user',
      populate: { path: 'user', select: 'name email' },
    })
    .sort('name section');

  const withCounts = await Promise.all(
    classes.map(async (c) => {
      const doc = c.toObject();
      doc.studentCount = await Student.countDocuments({ class: c._id, status: 'active' });
      return doc;
    })
  );

  res.json({ success: true, data: { classes: withCounts } });
});

export const createClass = catchAsync(async (req, res) => {
  const { name, section, academicYear, department, capacity, classTeacher } = req.body;

  if (!name?.trim() || !academicYear?.trim()) {
    throw new AppError('Class name and academic year are required', 400);
  }

  const existing = await Class.findOne({
    name: name.trim(),
    section: (section || 'A').trim(),
    academicYear: academicYear.trim(),
  });
  if (existing) throw new AppError('A class with this name, section, and year already exists', 400);

  const classDoc = await Class.create({
    name: name.trim(),
    section: (section || 'A').trim(),
    academicYear: academicYear.trim(),
    department: department || undefined,
    capacity: capacity || 40,
    classTeacher: classTeacher || undefined,
    status: 'active',
  });

  if (classTeacher) {
    await syncTeacherClassAssignment(classDoc._id, classTeacher);
  }

  await logActivity(req.user._id, 'CREATE_CLASS', { resource: 'Class', resourceId: classDoc._id });

  const populated = await Class.findById(classDoc._id)
    .populate('department', 'name code')
    .populate({
      path: 'classTeacher',
      populate: { path: 'user', select: 'name email' },
    });

  res.status(201).json({ success: true, data: { class: populated } });
});

export const updateClass = catchAsync(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new AppError('Class not found', 404);

  const { name, section, academicYear, department, capacity, status, classTeacher } = req.body;

  if (name !== undefined) classDoc.name = name.trim();
  if (section !== undefined) classDoc.section = section.trim();
  if (academicYear !== undefined) classDoc.academicYear = academicYear.trim();
  if (department !== undefined) classDoc.department = department || undefined;
  if (capacity !== undefined) classDoc.capacity = capacity;
  if (status !== undefined) classDoc.status = status;

  await classDoc.save();

  if (classTeacher !== undefined) {
    if (classTeacher) {
      await syncTeacherClassAssignment(classDoc._id, classTeacher);
    } else {
      if (classDoc.classTeacher) {
        await Teacher.findByIdAndUpdate(classDoc.classTeacher, {
          $pull: { classes: classDoc._id },
        });
      }
      classDoc.classTeacher = undefined;
      await classDoc.save();
    }
  }

  const populated = await Class.findById(classDoc._id)
    .populate('department', 'name code')
    .populate({
      path: 'classTeacher',
      populate: { path: 'user', select: 'name email' },
    });

  res.json({ success: true, data: { class: populated } });
});

export const assignTeacher = catchAsync(async (req, res) => {
  const { teacherId } = req.body;
  if (!teacherId) throw new AppError('Teacher is required', 400);

  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new AppError('Class not found', 404);

  await syncTeacherClassAssignment(classDoc._id, teacherId);

  const populated = await Class.findById(classDoc._id)
    .populate('department', 'name code')
    .populate({
      path: 'classTeacher',
      populate: { path: 'user', select: 'name email' },
    });

  await logActivity(req.user._id, 'ASSIGN_CLASS_TEACHER', {
    resource: 'Class',
    resourceId: classDoc._id,
    teacherId,
  });

  res.json({ success: true, data: { class: populated } });
});

export const deleteClass = catchAsync(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new AppError('Class not found', 404);

  const studentCount = await Student.countDocuments({ class: classDoc._id });
  if (studentCount > 0) {
    throw new AppError('Cannot delete a class that has students. Set status to inactive instead.', 400);
  }

  if (classDoc.classTeacher) {
    await Teacher.findByIdAndUpdate(classDoc.classTeacher, {
      $pull: { classes: classDoc._id },
    });
  }

  await Class.findByIdAndDelete(classDoc._id);
  await logActivity(req.user._id, 'DELETE_CLASS', { resource: 'Class', resourceId: classDoc._id });

  res.json({ success: true, message: 'Class deleted' });
});
