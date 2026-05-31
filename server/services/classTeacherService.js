import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';

export const getEffectiveTeacherIds = (classDoc) => {
  if (classDoc?.teachers?.length) {
    return classDoc.teachers.map((id) => id.toString());
  }
  if (classDoc?.classTeacher) {
    return [classDoc.classTeacher.toString()];
  }
  return [];
};

export const syncClassTeachers = async (classId, teacherIds = []) => {
  const uniqueIds = [...new Set(teacherIds.filter(Boolean).map((id) => id.toString()))];

  if (uniqueIds.length) {
    const count = await Teacher.countDocuments({ _id: { $in: uniqueIds } });
    if (count !== uniqueIds.length) {
      throw new AppError('One or more teachers not found', 404);
    }
  }

  const classDoc = await Class.findById(classId).select('teachers classTeacher');
  if (!classDoc) throw new AppError('Class not found', 404);

  const previousIds = getEffectiveTeacherIds(classDoc);
  const toRemove = previousIds.filter((id) => !uniqueIds.includes(id));

  await Class.findByIdAndUpdate(classId, {
    teachers: uniqueIds,
    classTeacher: uniqueIds[0] || undefined,
  });

  await Promise.all([
    ...uniqueIds.map((tid) =>
      Teacher.findByIdAndUpdate(tid, { $addToSet: { classes: classId } })
    ),
    ...toRemove.map((tid) =>
      Teacher.findByIdAndUpdate(tid, { $pull: { classes: classId } })
    ),
  ]);
};

export const populateClass = (query) =>
  query
    .populate('department', 'name code')
    .populate({
      path: 'teachers',
      select: 'employeeId user',
      populate: { path: 'user', select: 'name email' },
    })
    .populate({
      path: 'classTeacher',
      select: 'employeeId user',
      populate: { path: 'user', select: 'name email' },
    });

export const normalizeClassTeachers = (classDoc) => {
  const doc = classDoc.toObject ? classDoc.toObject() : { ...classDoc };
  if (!doc.teachers?.length && doc.classTeacher) {
    doc.teachers = [doc.classTeacher];
  }
  return doc;
};
