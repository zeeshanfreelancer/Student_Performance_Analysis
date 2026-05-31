import Parent from '../models/Parent.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';

const normalizeIds = (ids = []) =>
  [...new Set(ids.filter(Boolean).map((id) => id.toString()))];

const studentPopulate = [
  { path: 'user', select: 'name email profileImage phone' },
  { path: 'class', select: 'name section academicYear' },
];

/** Resolve parent profile for logged-in user */
export const getParentByUserId = async (userId) => {
  const parent = await Parent.findOne({ user: userId });
  if (!parent) throw new AppError('Parent profile not found', 404);
  return parent;
};

/**
 * Students linked to this parent (source of truth: Student.parentId).
 * Repairs Parent.children if out of sync.
 */
export const getLinkedChildrenForUser = async (userId) => {
  const parent = await getParentByUserId(userId);

  const children = await Student.find({
    parentId: parent._id,
    status: { $in: ['active', 'completed', 'graduated'] },
  }).populate(studentPopulate);

  const linkedIds = children.map((c) => c._id.toString()).sort();
  const storedIds = parent.children.map((id) => id.toString()).sort();
  if (linkedIds.join(',') !== storedIds.join(',')) {
    parent.children = children.map((c) => c._id);
    await parent.save();
  }

  return { parent, children };
};

/** Ensure student belongs to the logged-in parent */
export const assertParentOwnsStudent = async (userId, studentId) => {
  const parent = await getParentByUserId(userId);
  const student = await Student.findOne({
    _id: studentId,
    parentId: parent._id,
  }).populate(studentPopulate);

  if (!student) {
    throw new AppError('Access denied: this student is not linked to your account', 403);
  }

  return { parent, student };
};

/**
 * Keep Parent.children and Student.parentId in sync.
 * A student can belong to at most one parent.
 */
export const syncParentChildren = async (parentId, studentIds = []) => {
  const parent = await Parent.findById(parentId);
  if (!parent) throw new AppError('Parent not found', 404);

  const nextIds = normalizeIds(studentIds);

  if (nextIds.length) {
    const count = await Student.countDocuments({ _id: { $in: nextIds } });
    if (count !== nextIds.length) throw new AppError('One or more students not found', 400);
  }

  const previousIds = parent.children.map((id) => id.toString());

  for (const studentId of nextIds) {
    const student = await Student.findById(studentId);
    if (!student) continue;

    const oldParentId = student.parentId?.toString();
    if (oldParentId && oldParentId !== parentId.toString()) {
      await Parent.findByIdAndUpdate(oldParentId, { $pull: { children: student._id } });
    }

    student.parentId = parent._id;
    await student.save();
  }

  const removedIds = previousIds.filter((id) => !nextIds.includes(id));
  if (removedIds.length) {
    await Student.updateMany(
      { _id: { $in: removedIds }, parentId: parent._id },
      { $unset: { parentId: 1 } }
    );
  }

  await Student.updateMany(
    { parentId: parent._id, _id: { $nin: nextIds } },
    { $unset: { parentId: 1 } }
  );

  parent.children = nextIds;
  await parent.save();

  return Parent.findById(parentId)
    .populate('user', 'name email phone')
    .populate({
      path: 'children',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'class', select: 'name section' },
      ],
    });
};

/** Link a single student to a parent (or unlink if parentId is null). */
export const linkStudentToParent = async (studentId, parentId) => {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const oldParentId = student.parentId?.toString();

  if (!parentId) {
    if (oldParentId) {
      await Parent.findByIdAndUpdate(oldParentId, { $pull: { children: student._id } });
    }
    student.parentId = undefined;
    await student.save();
    return student;
  }

  const parent = await Parent.findById(parentId);
  if (!parent) throw new AppError('Parent not found', 404);

  if (oldParentId && oldParentId !== parentId.toString()) {
    await Parent.findByIdAndUpdate(oldParentId, { $pull: { children: student._id } });
  }

  student.parentId = parent._id;
  await student.save();

  await Parent.findByIdAndUpdate(parent._id, { $addToSet: { children: student._id } });

  return student;
};
