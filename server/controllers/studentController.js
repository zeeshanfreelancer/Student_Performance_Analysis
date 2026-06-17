import Student from '../models/Student.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity } from '../services/activityLogService.js';
import { sendAccountCredentialsEmail } from '../services/emailService.js';
import { createUserAccount } from '../services/accountService.js';
import { getSubjectWiseMarks } from '../services/analyticsService.js';
import { getStudentEnrollmentStart } from '../services/attendanceService.js';
import { linkStudentToParent } from '../services/parentLinkService.js';
import { syncUserStatusFromProfile, STUDENT_STATUSES } from '../services/statusService.js';

const USER_POPULATE_FIELDS = 'name email phone profileImage status role';

export const createStudent = catchAsync(async (req, res) => {
  let {
    name, email, password, rollNo, class: classId, department, semester,
    fatherName, motherName, parentId, dob, address, bloodGroup, phone, gender,
    emergencyContact, previousEducation,
  } = req.body;

  if (!name?.trim()) throw new AppError('Name is required', 400);
  if (!email?.trim()) throw new AppError('Email is required', 400);
  if (!rollNo?.trim()) throw new AppError('Roll number is required', 400);

  const normalizedRollNo = rollNo.trim().toUpperCase();
  const plainPassword = password?.trim() || 'Student@123';

  if (plainPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const rollExists = await Student.findOne({ rollNo: normalizedRollNo });
  if (rollExists) throw new AppError('Roll number already exists', 400);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) throw new AppError('Teacher profile not found', 403);
    const teacherClassIds = (teacher.classes || []).map((id) => id.toString());
    if (!teacherClassIds.length) {
      throw new AppError('No class assigned to your teacher profile', 403);
    }
    if (classId && !teacherClassIds.includes(classId.toString())) {
      throw new AppError('You can only add students to your assigned classes', 403);
    }
    if (!classId) classId = teacher.classes[0];
  }

  if (!classId) throw new AppError('Class is required', 400);

  const classExists = await Class.findById(classId);
  if (!classExists) throw new AppError('Selected class not found', 400);

  const user = await createUserAccount({
    name: name.trim(),
    email: email.trim(),
    password: plainPassword,
    role: 'student',
    phone: phone || '',
    gender: gender || '',
    status: 'active',
  });

  let profileImage = '';
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'students');
    profileImage = result.secure_url;
  }

  let student;
  try {
    student = await Student.create({
      user: user._id,
      rollNo: normalizedRollNo,
      class: classId,
      department: department || undefined,
      semester: semester || 1,
      fatherName: fatherName || '',
      motherName: motherName || '',
      parentId: parentId || undefined,
      dob: dob || undefined,
      address: address || '',
      bloodGroup: bloodGroup || '',
      profileImage,
      emergencyContact,
      previousEducation,
      status: 'active',
      academicTimeline: [{ title: 'Enrolled', description: 'Student enrolled', type: 'enrollment' }],
      enrollmentDate: new Date(),
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  if (parentId) {
    await linkStudentToParent(student._id, parentId);
  }

  await logActivity(req.user._id, 'CREATE_STUDENT', { resource: 'Student', resourceId: student._id });

  const populated = await Student.findById(student._id)
    .populate('user', USER_POPULATE_FIELDS)
    .populate('class', 'name section')
    .populate('department', 'name')
    .populate('parentId');

  const emailResult = await sendAccountCredentialsEmail({
    name: user.name,
    email: user.email,
    password: plainPassword,
    role: 'student',
  });

  res.status(201).json({
    success: true,
    message: emailResult.sent
      ? 'Student created. Login credentials sent to their email.'
      : 'Student created successfully. They can sign in with the email and password you set.',
    data: {
      student: populated,
      emailSent: emailResult.sent === true,
      login: { email: user.email, role: user.role },
    },
  });
});

const getTeacherClassIds = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId }).select('classes');
  return (teacher?.classes || []).map((id) => id.toString());
};

export const getStudents = catchAsync(async (req, res) => {
  let query = Student.find()
    .populate('user', USER_POPULATE_FIELDS)
    .populate('class', 'name section')
    .populate('department', 'name code')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email phone' } });

  if (req.user.role === 'teacher') {
    const teacherClassIds = await getTeacherClassIds(req.user._id);
    if (!teacherClassIds.length) {
      return res.json({
        success: true,
        results: 0,
        total: 0,
        page: parseInt(req.query.page, 10) || 1,
        data: { students: [] },
      });
    }
    if (req.query.class) {
      if (!teacherClassIds.includes(req.query.class.toString())) {
        throw new AppError('You can only view students in your assigned classes', 403);
      }
      query = query.where('class', req.query.class);
    } else {
      query = query.where('class').in(teacherClassIds);
    }
  } else if (req.query.class) {
    query = query.where('class', req.query.class);
  }
  if (req.query.department) query = query.where('department', req.query.department);
  if (req.query.status) {
    const statusFilter =
      req.query.status === 'completed'
        ? { $in: ['completed', 'graduated'] }
        : req.query.status;
    query = query.where('status', statusFilter);
  }
  if (req.query.gpaBelow) query = query.where('gpa').lt(parseFloat(req.query.gpaBelow));
  if (req.query.attendanceBelow) {
    query = query.where('attendancePercentage').lt(parseFloat(req.query.attendanceBelow));
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
    query = query.find({
      $or: [
        { rollNo: regex },
        { user: { $in: users.map((u) => u._id) } },
      ],
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const total = await Student.countDocuments(query.getFilter());
  const students = await query.skip(skip).limit(limit).sort('-createdAt');

  res.json({ success: true, results: students.length, total, page, data: { students } });
});

export const getStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', `${USER_POPULATE_FIELDS} gender address`)
    .populate('class', 'name section academicYear')
    .populate('department', 'name code')
    .populate('parentId')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email phone' } });

  if (!student) throw new AppError('Student not found', 404);

  if (req.user.role === 'student') {
    const own = await Student.findOne({ user: req.user._id });
    if (!own || own._id.toString() !== student._id.toString()) {
      throw new AppError('You can only view your own profile', 403);
    }
  }

  if (req.user.role === 'teacher') {
    const teacherClassIds = await getTeacherClassIds(req.user._id);
    if (!teacherClassIds.includes(student.class._id.toString())) {
      throw new AppError('You do not have permission to view this student', 403);
    }
  }

  res.json({ success: true, data: { student } });
});

export const getStudentProfile = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', `${USER_POPULATE_FIELDS} gender address`)
    .populate('class', 'name section')
    .populate('department', 'name')
    .populate('parentId');

  if (!student) throw new AppError('Student not found', 404);

  if (req.user.role === 'student') {
    const own = await Student.findOne({ user: req.user._id });
    if (!own || own._id.toString() !== student._id.toString()) {
      throw new AppError('You can only view your own profile', 403);
    }
  }

  const enrolledFrom = getStudentEnrollmentStart(student);

  const [attendance, results, assignments, subjectMarks] = await Promise.all([
    Attendance.find({ student: student._id, date: { $gte: enrolledFrom } }).sort('-date'),
    Result.find({ student: student._id }).populate('subject', 'name code').sort('-createdAt'),
    Assignment.find({ class: student.class, status: 'active' })
      .populate('teacher', 'employeeId')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } }),
    getSubjectWiseMarks(student._id),
  ]);

  res.json({
    success: true,
    data: {
      student,
      attendance,
      results,
      assignments,
      subjectMarks,
      academicTimeline: student.academicTimeline,
      enrollmentDate: enrolledFrom,
    },
  });
});

export const updateStudent = catchAsync(async (req, res) => {
  const existing = await Student.findById(req.params.id);
  if (!existing) throw new AppError('Student not found', 404);

  if (req.user.role === 'teacher') {
    const teacherClassIds = await getTeacherClassIds(req.user._id);
    if (!teacherClassIds.includes(existing.class.toString())) {
      throw new AppError('You do not have permission to update this student', 403);
    }
    if (req.body.class && !teacherClassIds.includes(req.body.class.toString())) {
      throw new AppError('You can only move students between your assigned classes', 403);
    }
  }

  let updates = { ...req.body };
  delete updates.email;
  delete updates.password;

  const parentIdUpdate = updates.parentId;
  delete updates.parentId;

  if (req.user.role === 'teacher') {
    const teacherAllowed = [
      'rollNo', 'class', 'semester', 'fatherName', 'motherName', 'dob', 'address',
      'bloodGroup', 'emergencyContact', 'previousEducation',
    ];
    updates = {};
    teacherAllowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    if (updates.rollNo) {
      updates.rollNo = updates.rollNo.trim().toUpperCase();
      const rollExists = await Student.findOne({
        rollNo: updates.rollNo,
        _id: { $ne: existing._id },
      });
      if (rollExists) throw new AppError('Roll number already exists', 400);
    }
  } else if (updates.rollNo) {
    updates.rollNo = updates.rollNo.trim().toUpperCase();
    const rollExists = await Student.findOne({
      rollNo: updates.rollNo,
      _id: { $ne: existing._id },
    });
    if (rollExists) throw new AppError('Roll number already exists', 400);
  }

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'students');
    updates.profileImage = result.secure_url;
  }

  const classChanged =
    updates.class && updates.class.toString() !== existing.class.toString();

  if (classChanged) {
    const [fromClass, toClass] = await Promise.all([
      Class.findById(existing.class).select('name section'),
      Class.findById(updates.class).select('name section'),
    ]);
    const fromLabel = fromClass ? `${fromClass.name} ${fromClass.section || ''}`.trim() : 'previous class';
    const toLabel = toClass ? `${toClass.name} ${toClass.section || ''}`.trim() : 'new class';
    await Student.findByIdAndUpdate(existing._id, {
      $push: {
        academicTimeline: {
          title: 'Class changed',
          description: `Moved from ${fromLabel} to ${toLabel}`,
          type: 'promotion',
        },
      },
    });
  }

  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email').populate('class', 'name section')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email' } });

  if (!student) throw new AppError('Student not found', 404);

  if (parentIdUpdate !== undefined && req.user.role === 'admin') {
    await linkStudentToParent(student._id, parentIdUpdate || null);
  }

  if (req.body.name || req.body.phone || req.body.gender !== undefined) {
    await User.findByIdAndUpdate(student.user._id || student.user, {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.phone !== undefined && { phone: req.body.phone }),
      ...(req.body.gender !== undefined && { gender: req.body.gender }),
    });
  }

  const updated = await Student.findById(student._id)
    .populate('user', USER_POPULATE_FIELDS)
    .populate('class', 'name section')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email' } });

  await logActivity(req.user._id, 'UPDATE_STUDENT', { resource: 'Student', resourceId: student._id });
  res.json({ success: true, data: { student: updated } });
});

export const updateStudentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!STUDENT_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${STUDENT_STATUSES.join(', ')}`, 400);
  }

  const student = await Student.findById(req.params.id).populate('user', 'name email');
  if (!student) throw new AppError('Student not found', 404);

  student.status = status;
  await student.save();

  await syncUserStatusFromProfile(student.user._id, status, 'student');

  await logActivity(req.user._id, 'UPDATE_STUDENT_STATUS', {
    resource: 'Student',
    resourceId: student._id,
    metadata: { status, rollNo: student.rollNo },
  });

  const updated = await Student.findById(student._id)
    .populate('user', USER_POPULATE_FIELDS)
    .populate('class', 'name section')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email' } });

  res.json({
    success: true,
    message: `Student status updated to ${status}`,
    data: { student: updated },
  });
});

export const deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Student not found', 404);
  if (student.parentId) {
    await Parent.findByIdAndUpdate(student.parentId, { $pull: { children: student._id } });
  }
  await User.findByIdAndDelete(student.user);
  await Student.findByIdAndDelete(student._id);
  await logActivity(req.user._id, 'DELETE_STUDENT', { resource: 'Student', resourceId: student._id });
  res.json({ success: true, message: 'Student deleted' });
});

export const advancedSearch = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.gpaBelow) filter.gpa = { $lt: parseFloat(req.query.gpaBelow) };
  if (req.query.gpaAbove) filter.gpa = { ...filter.gpa, $gte: parseFloat(req.query.gpaAbove) };
  if (req.query.attendanceBelow) filter.attendancePercentage = { $lt: parseFloat(req.query.attendanceBelow) };
  if (req.query.failed) filter.gpa = { $lt: 2.0 };
  if (req.query.top) {
    const students = await Student.find(filter)
      .populate('user', 'name email')
      .populate('class', 'name section')
      .sort('-gpa')
      .limit(parseInt(req.query.limit, 10) || 10);
    return res.json({ success: true, data: { students } });
  }

  const students = await Student.find(filter)
    .populate('user', 'name email')
    .populate('class', 'name section')
    .sort('-gpa');

  res.json({ success: true, results: students.length, data: { students } });
});
