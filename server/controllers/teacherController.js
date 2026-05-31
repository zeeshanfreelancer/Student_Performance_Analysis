import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import { syncUserStatusFromProfile, TEACHER_STATUSES } from '../services/statusService.js';

export const getTeachers = catchAsync(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { status: 'active' };

  const teachers = await Teacher.find(filter)
    .populate('user', 'name email phone status')
    .populate('department', 'name code')
    .populate('classes', 'name section academicYear')
    .populate({
      path: 'subjects',
      select: 'name code class',
      populate: { path: 'class', select: 'name section academicYear' },
    })
    .sort('employeeId');

  res.json({ success: true, results: teachers.length, data: { teachers } });
});

export const updateTeacherStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!TEACHER_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${TEACHER_STATUSES.join(', ')}`, 400);
  }

  const teacher = await Teacher.findById(req.params.id).populate('user', 'name email');
  if (!teacher) throw new AppError('Teacher not found', 404);

  teacher.status = status;
  await teacher.save();

  await syncUserStatusFromProfile(teacher.user._id, status, 'teacher');

  await logActivity(req.user._id, 'UPDATE_TEACHER_STATUS', {
    resource: 'Teacher',
    resourceId: teacher._id,
    metadata: { status, employeeId: teacher.employeeId },
  });

  res.json({
    success: true,
    message: `Teacher status updated to ${status}`,
    data: { teacher },
  });
});
