import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity } from '../services/activityLogService.js';

const resolveTeacherId = async (req) => {
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) throw new AppError('Teacher profile not found', 404);
    return teacher;
  }
  if (req.user.role === 'admin') {
    if (!req.body.teacher) throw new AppError('Teacher is required', 400);
    const teacher = await Teacher.findById(req.body.teacher);
    if (!teacher) throw new AppError('Teacher not found', 404);
    return teacher;
  }
  throw new AppError('You do not have permission', 403);
};

export const createAssignment = catchAsync(async (req, res) => {
  const teacher = await resolveTeacherId(req);
  const { title, description, deadline, class: classId, subject, maxMarks, status } = req.body;

  if (!title || !deadline || !classId) {
    throw new AppError('Title, deadline, and class are required', 400);
  }

  const classIds = (teacher.classes || []).map((id) => id.toString());
  if (req.user.role === 'teacher' && classIds.length && !classIds.includes(classId.toString())) {
    throw new AppError('You can only create assignments for your assigned classes', 403);
  }

  const attachments = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'assignments');
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
      });
    }
  }

  const assignment = await Assignment.create({
    title,
    description: description || '',
    deadline: new Date(deadline),
    class: classId,
    subject: subject || undefined,
    teacher: teacher._id,
    maxMarks: maxMarks ? Number(maxMarks) : 100,
    status: status || 'active',
    attachments,
  });

  const populated = await Assignment.findById(assignment._id)
    .populate('class', 'name section')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .populate('subject', 'name code');

  await logActivity(req.user._id, 'CREATE_ASSIGNMENT', {
    resource: 'Assignment',
    resourceId: assignment._id,
  });

  res.status(201).json({ success: true, data: { assignment: populated } });
});

export const getAssignments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) throw new AppError('Teacher profile not found', 404);
    filter.teacher = teacher._id;
  } else if (req.query.teacher) {
    filter.teacher = req.query.teacher;
  }

  const assignments = await Assignment.find(filter)
    .populate('class', 'name section')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .populate('subject', 'name code')
    .sort('-createdAt');

  res.json({ success: true, data: { assignments } });
});

export const getAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('class', 'name section academicYear')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
    .populate('subject', 'name code')
    .populate({
      path: 'submissions.student',
      select: 'rollNo user',
      populate: { path: 'user', select: 'name email' },
    });

  if (!assignment) throw new AppError('Assignment not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || assignment.teacher._id.toString() !== teacher._id.toString()) {
      throw new AppError('You do not have permission to view this assignment', 403);
    }
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || assignment.class._id.toString() !== student.class.toString()) {
      throw new AppError('You do not have permission to view this assignment', 403);
    }
  }

  res.json({ success: true, data: { assignment } });
});

export const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || assignment.teacher.toString() !== teacher._id.toString()) {
      throw new AppError('You can only edit your own assignments', 403);
    }
  }

  const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('class', 'name section')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

  res.json({ success: true, data: { assignment: updated } });
});

export const deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || assignment.teacher.toString() !== teacher._id.toString()) {
      throw new AppError('You can only delete your own assignments', 403);
    }
  }

  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Assignment deleted' });
});

export const submitAssignment = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', 404);

  if (assignment.class.toString() !== student.class.toString()) {
    throw new AppError('This assignment is not for your class', 403);
  }

  if (assignment.status === 'closed') {
    throw new AppError('This assignment is closed for submissions', 400);
  }

  if (!req.files?.length) {
    throw new AppError('Please upload at least one file', 400);
  }

  const files = [];
  for (const file of req.files) {
    const result = await uploadToCloudinary(file.buffer, 'submissions');
    files.push({
      url: result.secure_url,
      publicId: result.public_id,
      name: file.originalname,
    });
  }

  const isLate = new Date() > new Date(assignment.deadline);
  const existing = assignment.submissions.findIndex(
    (s) => s.student.toString() === student._id.toString()
  );

  const submission = {
    student: student._id,
    files,
    submittedAt: new Date(),
    status: isLate ? 'late' : 'submitted',
  };

  if (existing >= 0) assignment.submissions[existing] = submission;
  else assignment.submissions.push(submission);

  await assignment.save();

  const populated = await Assignment.findById(assignment._id)
    .populate('class', 'name section')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

  res.json({ success: true, message: 'Assignment submitted successfully', data: { assignment: populated } });
});

export const getStudentAssignments = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  const assignments = await Assignment.find({ class: student.class, status: 'active' })
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .populate('subject', 'name code')
    .sort('deadline');

  const withStatus = assignments.map((a) => {
    const sub = a.submissions.find((s) => s.student.toString() === student._id.toString());
    return {
      ...a.toObject(),
      submissionStatus: sub?.status || 'pending',
      submission: sub,
    };
  });

  res.json({ success: true, data: { assignments: withStatus } });
});
