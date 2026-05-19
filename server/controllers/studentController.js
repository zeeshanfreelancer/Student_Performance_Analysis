import Student from '../models/Student.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Result from '../models/Result.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity } from '../services/activityLogService.js';
import { getSubjectWiseMarks } from '../services/analyticsService.js';

export const createStudent = catchAsync(async (req, res) => {
  let {
    name, email, password, rollNo, class: classId, department, semester,
    fatherName, motherName, parentId, dob, address, bloodGroup, phone, gender,
    emergencyContact,
  } = req.body;

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

  const user = await User.create({
    name, email, password: password || 'Student@123', role: 'student', phone, gender,
  });

  let profileImage = '';
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'students');
    profileImage = result.secure_url;
  }

  const student = await Student.create({
    user: user._id,
    rollNo,
    class: classId,
    department,
    semester,
    fatherName,
    motherName,
    parentId,
    dob,
    address,
    bloodGroup,
    profileImage,
    emergencyContact,
    academicTimeline: [{ title: 'Enrolled', description: 'Student enrolled', type: 'enrollment' }],
  });

  if (parentId) {
    await Parent.findByIdAndUpdate(parentId, { $addToSet: { children: student._id } });
  }

  await logActivity(req.user._id, 'CREATE_STUDENT', { resource: 'Student', resourceId: student._id });

  const populated = await Student.findById(student._id)
    .populate('user', 'name email phone profileImage')
    .populate('class', 'name section')
    .populate('department', 'name')
    .populate('parentId');

  res.status(201).json({ success: true, data: { student: populated } });
});

const getTeacherClassIds = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId }).select('classes');
  return (teacher?.classes || []).map((id) => id.toString());
};

export const getStudents = catchAsync(async (req, res) => {
  let query = Student.find().populate('user', 'name email phone profileImage status')
    .populate('class', 'name section')
    .populate('department', 'name code');

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
    .populate('user', 'name email phone profileImage gender address')
    .populate('class', 'name section academicYear')
    .populate('department', 'name code')
    .populate('parentId')
    .populate({ path: 'parentId', populate: { path: 'user', select: 'name email phone' } });

  if (!student) throw new AppError('Student not found', 404);

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
    .populate('user', 'name email phone profileImage gender address')
    .populate('class', 'name section')
    .populate('department', 'name')
    .populate('parentId');

  if (!student) throw new AppError('Student not found', 404);

  const [attendance, results, assignments, subjectMarks] = await Promise.all([
    Attendance.find({ student: student._id }).sort('-date').limit(30),
    Result.find({ student: student._id }).populate('subject', 'name code').sort('-createdAt'),
    Assignment.find({ class: student.class, status: 'active' })
      .populate('teacher', 'employeeId')
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } }),
    getSubjectWiseMarks(student._id),
  ]);

  res.json({
    success: true,
    data: { student, attendance, results, assignments, subjectMarks, academicTimeline: student.academicTimeline },
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
      throw new AppError('You can only assign students to your classes', 403);
    }
  }

  const updates = { ...req.body };
  delete updates.email;
  delete updates.password;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'students');
    updates.profileImage = result.secure_url;
  }

  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email').populate('class', 'name section');

  if (!student) throw new AppError('Student not found', 404);

  if (req.body.name || req.body.phone) {
    await User.findByIdAndUpdate(student.user, {
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.phone && { phone: req.body.phone }),
    });
  }

  await logActivity(req.user._id, 'UPDATE_STUDENT', { resource: 'Student', resourceId: student._id });
  res.json({ success: true, data: { student } });
});

export const deleteStudent = catchAsync(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError('Student not found', 404);
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
