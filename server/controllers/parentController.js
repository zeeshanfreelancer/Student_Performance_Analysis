import Parent from '../models/Parent.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Assignment from '../models/Assignment.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { getMonthlyAttendanceStats } from '../services/attendanceService.js';
import { getSubjectWiseMarks } from '../services/analyticsService.js';
import { syncParentChildren, getLinkedChildrenForUser, assertParentOwnsStudent } from '../services/parentLinkService.js';
import { logActivity } from '../services/activityLogService.js';

const parentListPopulate = [
  { path: 'user', select: 'name email phone status' },
  {
    path: 'children',
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'class', select: 'name section' },
    ],
  },
];

/** Admin / teacher: list parent accounts for assignment UI */
export const listParents = catchAsync(async (req, res) => {
  const parents = await Parent.find({ status: 'active' })
    .populate(parentListPopulate)
    .sort('-createdAt');

  res.json({ success: true, results: parents.length, data: { parents } });
});

/** Admin / teacher: get one parent with linked children */
export const getParentById = catchAsync(async (req, res) => {
  const parent = await Parent.findById(req.params.id).populate(parentListPopulate);
  if (!parent) throw new AppError('Parent not found', 404);
  res.json({ success: true, data: { parent } });
});

/** Admin: update parent profile */
export const updateParent = catchAsync(async (req, res) => {
  const parent = await Parent.findById(req.params.id);
  if (!parent) throw new AppError('Parent not found', 404);

  const {
    name, phone, gender, relation, occupation, workplace, dob, address,
    bloodGroup, alternatePhone, spouseName, emergencyContact,
  } = req.body;

  const profileFields = {
    relation, occupation, workplace, dob, address, bloodGroup,
    alternatePhone, spouseName, emergencyContact,
  };
  Object.entries(profileFields).forEach(([key, value]) => {
    if (value !== undefined) parent[key] = value;
  });
  if (dob) parent.dob = new Date(dob);

  await parent.save();

  if (name || phone !== undefined || gender !== undefined) {
    await User.findByIdAndUpdate(parent.user, {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(gender !== undefined && { gender }),
    });
  }

  const updated = await Parent.findById(parent._id).populate(parentListPopulate);

  await logActivity(req.user._id, 'UPDATE_PARENT', {
    resource: 'Parent',
    resourceId: parent._id,
  });

  res.json({ success: true, data: { parent: updated } });
});

/** Admin / teacher: assign or update linked students */
export const updateParentChildren = catchAsync(async (req, res) => {
  const { children } = req.body;
  if (!Array.isArray(children)) {
    throw new AppError('children must be an array of student IDs', 400);
  }

  const parent = await syncParentChildren(req.params.id, children);

  await logActivity(req.user._id, 'UPDATE_PARENT_CHILDREN', {
    resource: 'Parent',
    resourceId: parent._id,
    metadata: { children },
  });

  res.json({
    success: true,
    message: 'Parent linked to selected students',
    data: { parent },
  });
});

export const getParentDashboard = catchAsync(async (req, res) => {
  const { parent, children } = await getLinkedChildrenForUser(req.user._id);

  const childrenData = await Promise.all(
    children.map(async (child) => {
      const [monthly, subjectMarks, recentAttendance, results] = await Promise.all([
        getMonthlyAttendanceStats(child._id, new Date().getFullYear(), new Date().getMonth() + 1),
        getSubjectWiseMarks(child._id),
        Attendance.find({ student: child._id }).sort('-date').limit(10),
        Result.find({ student: child._id }).populate('subject', 'name').sort('-createdAt').limit(10),
      ]);

      const assignments = await Assignment.find({ class: child.class, status: 'active' });
      const alerts = [];
      if (child.attendancePercentage < 75) {
        alerts.push({ type: 'attendance', message: 'Low attendance alert' });
      }
      if (child.gpa < 2.5) {
        alerts.push({ type: 'performance', message: 'Academic performance needs attention' });
      }

      return {
        student: child,
        monthly,
        subjectMarks,
        recentAttendance,
        results,
        assignments: assignments.length,
        alerts,
      };
    })
  );

  res.json({ success: true, data: { parent, children: childrenData } });
});

export const getChildProfile = catchAsync(async (req, res) => {
  const { student } = await assertParentOwnsStudent(req.user._id, req.params.childId);

  const [attendance, results, assignments, subjectMarks] = await Promise.all([
    Attendance.find({ student: student._id }).sort('-date').limit(30),
    Result.find({ student: student._id })
      .populate('subject', 'name code')
      .sort('-createdAt'),
    Assignment.find({ class: student.class, status: 'active' }),
    getSubjectWiseMarks(student._id),
  ]);

  res.json({
    success: true,
    data: { student, attendance, results, assignments, subjectMarks },
  });
});
