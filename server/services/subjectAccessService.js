import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';

export const assertTeacherOwnsSubject = async (user, subjectId) => {
  const subject = await Subject.findById(subjectId).populate('class', 'name section academicYear');
  if (!subject) throw new AppError('Subject not found', 404);

  if (user.role !== 'teacher') {
    throw new AppError('Only teachers can perform this action', 403);
  }

  const teacher = await Teacher.findOne({ user: user._id }).select('subjects');
  const allowed = (teacher?.subjects || []).map((id) => id.toString());
  if (!allowed.includes(subjectId.toString())) {
    throw new AppError('You are not assigned to this subject', 403);
  }

  return subject;
};
