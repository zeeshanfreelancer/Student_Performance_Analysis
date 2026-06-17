import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import { syncUserStatusFromProfile, TEACHER_STATUSES } from '../services/statusService.js';

const teacherPopulate = [
  { path: 'user', select: 'name email phone status gender address' },
  { path: 'department', select: 'name code' },
  { path: 'classes', select: 'name section academicYear' },
  {
    path: 'subjects',
    select: 'name code class',
    populate: { path: 'class', select: 'name section academicYear' },
  },
];

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

export const getTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate(teacherPopulate);
  if (!teacher) throw new AppError('Teacher not found', 404);
  res.json({ success: true, data: { teacher } });
});

export const updateTeacher = catchAsync(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found', 404);

  const {
    name, phone, gender, employeeId, qualification, experience, joiningDate,
    salary, dob, address, bloodGroup, emergencyContact, previousEmployment,
  } = req.body;

  if (employeeId && employeeId !== teacher.employeeId) {
    const exists = await Teacher.findOne({ employeeId, _id: { $ne: teacher._id } });
    if (exists) throw new AppError('Employee ID already in use', 400);
    teacher.employeeId = employeeId.trim();
  }

  const profileFields = {
    qualification, experience, joiningDate, salary, dob, address, bloodGroup,
    emergencyContact, previousEmployment,
  };
  Object.entries(profileFields).forEach(([key, value]) => {
    if (value !== undefined) teacher[key] = value;
  });
  if (experience != null) teacher.experience = Number(experience) || 0;
  if (salary != null) teacher.salary = salary === '' ? undefined : Number(salary);
  if (joiningDate) teacher.joiningDate = new Date(joiningDate);
  if (dob) teacher.dob = new Date(dob);

  await teacher.save();

  if (name || phone || gender !== undefined) {
    await User.findByIdAndUpdate(teacher.user, {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(gender !== undefined && { gender }),
    });
  }

  const updated = await Teacher.findById(teacher._id).populate(teacherPopulate);

  await logActivity(req.user._id, 'UPDATE_TEACHER', {
    resource: 'Teacher',
    resourceId: teacher._id,
  });

  res.json({ success: true, data: { teacher: updated } });
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
