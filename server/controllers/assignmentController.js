import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity } from '../services/activityLogService.js';

export const createAssignment = catchAsync(async (req, res) => {
  const attachments = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'assignments');
      attachments.push({ url: result.secure_url, publicId: result.public_id, name: file.originalname });
    }
  }

  const assignment = await Assignment.create({
    ...req.body,
    teacher: req.body.teacher || req.user.teacherProfile,
    attachments,
  });

  await logActivity(req.user._id, 'CREATE_ASSIGNMENT', { resource: 'Assignment', resourceId: assignment._id });
  res.status(201).json({ success: true, data: { assignment } });
});

export const getAssignments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.teacher) filter.teacher = req.query.teacher;
  if (req.query.status) filter.status = req.query.status;

  const assignments = await Assignment.find(filter)
    .populate('class', 'name section')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .sort('-createdAt');

  res.json({ success: true, data: { assignments } });
});

export const getAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('class', 'name section')
    .populate({ path: 'submissions.student', populate: { path: 'user', select: 'name' } });
  if (!assignment) throw new AppError('Assignment not found', 404);
  res.json({ success: true, data: { assignment } });
});

export const updateAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!assignment) throw new AppError('Assignment not found', 404);
  res.json({ success: true, data: { assignment } });
});

export const deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', 404);
  res.json({ success: true, message: 'Assignment deleted' });
});

export const submitAssignment = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new AppError('Assignment not found', 404);

  const files = [];
  if (req.files?.length) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'submissions');
      files.push({ url: result.secure_url, publicId: result.public_id, name: file.originalname });
    }
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
  res.json({ success: true, data: { assignment } });
});

export const getStudentAssignments = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  const assignments = await Assignment.find({ class: student.class, status: 'active' })
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .sort('deadline');

  const withStatus = assignments.map((a) => {
    const sub = a.submissions.find((s) => s.student.toString() === student._id.toString());
    return { ...a.toObject(), submissionStatus: sub?.status || 'pending', submission: sub };
  });

  res.json({ success: true, data: { assignments: withStatus } });
});
