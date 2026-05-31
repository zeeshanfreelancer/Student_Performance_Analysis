import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';

export const teacherHasSubjectsInClass = async (teacherId, classId, excludeSubjectId = null) => {
  const filter = {
    teacher: teacherId,
    class: classId,
    status: 'active',
  };
  if (excludeSubjectId) filter._id = { $ne: excludeSubjectId };
  return Subject.countDocuments(filter) > 0;
};

export const syncSubjectTeacher = async (subjectId, teacherId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new AppError('Subject not found', 404);

  const previousTeacherId = subject.teacher?.toString();

  if (!teacherId) {
    await Subject.findByIdAndUpdate(subjectId, { $unset: { teacher: 1 } });
    if (previousTeacherId) {
      const stillInClass = await teacherHasSubjectsInClass(
        previousTeacherId,
        subject.class,
        subjectId
      );
      await Teacher.findByIdAndUpdate(previousTeacherId, {
        $pull: { subjects: subjectId },
        ...(!stillInClass ? { classes: subject.class } : {}),
      });
    }
    return subject;
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new AppError('Teacher not found', 404);

  if (previousTeacherId && previousTeacherId !== teacherId.toString()) {
    const stillInClass = await teacherHasSubjectsInClass(
      previousTeacherId,
      subject.class,
      subjectId
    );
    await Teacher.findByIdAndUpdate(previousTeacherId, {
      $pull: { subjects: subjectId },
      ...(!stillInClass ? { classes: subject.class } : {}),
    });
  }

  await Subject.findByIdAndUpdate(subjectId, { teacher: teacherId });
  await Teacher.findByIdAndUpdate(teacherId, {
    $addToSet: { subjects: subjectId, classes: subject.class },
  });

  return subject;
};
