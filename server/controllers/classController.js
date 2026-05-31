import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import {
  syncClassTeachers,
  populateClass,
  normalizeClassTeachers,
  getEffectiveTeacherIds,
} from '../services/classTeacherService.js';

const resolveTeacherIds = (body) => {
  if (Array.isArray(body.teacherIds) && body.teacherIds.length) {
    return body.teacherIds;
  }
  if (body.classTeacher) return [body.classTeacher];
  if (body.teacherId) return [body.teacherId];
  return [];
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

  const classes = await populateClass(Class.find(filter)).sort('name section');

  const withCounts = await Promise.all(
    classes.map(async (c) => {
      const doc = normalizeClassTeachers(c);
      doc.studentCount = await Student.countDocuments({ class: c._id, status: 'active' });
      return doc;
    })
  );

  res.json({ success: true, data: { classes: withCounts } });
});

export const createClass = catchAsync(async (req, res) => {
  const { name, section, academicYear, department, capacity } = req.body;
  const teacherIds = resolveTeacherIds(req.body);

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
    status: 'active',
  });

  if (teacherIds.length) {
    await syncClassTeachers(classDoc._id, teacherIds);
  }

  await logActivity(req.user._id, 'CREATE_CLASS', { resource: 'Class', resourceId: classDoc._id });

  const populated = normalizeClassTeachers(await populateClass(Class.findById(classDoc._id)));

  res.status(201).json({ success: true, data: { class: populated } });
});

export const updateClass = catchAsync(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new AppError('Class not found', 404);

  const { name, section, academicYear, department, capacity, status } = req.body;
  const hasTeacherUpdate =
    req.body.teacherIds !== undefined ||
    req.body.classTeacher !== undefined ||
    req.body.teacherId !== undefined;

  if (name !== undefined) classDoc.name = name.trim();
  if (section !== undefined) classDoc.section = section.trim();
  if (academicYear !== undefined) classDoc.academicYear = academicYear.trim();
  if (department !== undefined) classDoc.department = department || undefined;
  if (capacity !== undefined) classDoc.capacity = capacity;
  if (status !== undefined) classDoc.status = status;

  await classDoc.save();

  if (hasTeacherUpdate) {
    const teacherIds = resolveTeacherIds(req.body);
    await syncClassTeachers(classDoc._id, teacherIds);
  }

  const populated = normalizeClassTeachers(await populateClass(Class.findById(classDoc._id)));

  res.json({ success: true, data: { class: populated } });
});

export const assignTeacher = catchAsync(async (req, res) => {
  const teacherIds = resolveTeacherIds(req.body);
  if (!teacherIds.length) {
    throw new AppError('Select at least one teacher', 400);
  }

  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw new AppError('Class not found', 404);

  await syncClassTeachers(classDoc._id, teacherIds);

  const populated = normalizeClassTeachers(await populateClass(Class.findById(classDoc._id)));

  await logActivity(req.user._id, 'ASSIGN_CLASS_TEACHERS', {
    resource: 'Class',
    resourceId: classDoc._id,
    metadata: { teacherIds },
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

  const teacherIds = getEffectiveTeacherIds(classDoc);
  await Promise.all(
    teacherIds.map((tid) =>
      Teacher.findByIdAndUpdate(tid, { $pull: { classes: classDoc._id } })
    )
  );

  await Class.findByIdAndDelete(classDoc._id);
  await logActivity(req.user._id, 'DELETE_CLASS', { resource: 'Class', resourceId: classDoc._id });

  res.json({ success: true, message: 'Class deleted' });
});
