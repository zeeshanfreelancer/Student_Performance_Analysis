import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import { logActivity } from '../services/activityLogService.js';
import ActivityLog from '../models/ActivityLog.js';

export const getAllUsers = catchAsync(async (req, res) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search(['name', 'email'])
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query.select('-password -refreshToken');
  const total = await User.countDocuments(
    req.query.role ? { role: req.query.role } : {}
  );

  res.json({
    success: true,
    results: users.length,
    total,
    page: features.page,
    data: { users },
  });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user } });
});

export const updateUser = catchAsync(async (req, res) => {
  const { status, role, name, phone, address } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status, role, name, phone, address },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) throw new AppError('User not found', 404);
  await logActivity(req.user._id, 'UPDATE_USER', {
    resource: 'User',
    resourceId: user._id,
    metadata: { status, role },
  });

  res.json({ success: true, data: { user } });
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  await logActivity(req.user._id, 'DELETE_USER', { resource: 'User', resourceId: user._id });
  res.json({ success: true, message: 'User deleted' });
});

export const getActivityLogs = catchAsync(async (req, res) => {
  const filter = req.query.user ? { user: req.query.user } : {};
  const logs = await ActivityLog.find(filter)
    .populate('user', 'name email role')
    .sort('-createdAt')
    .limit(parseInt(req.query.limit, 10) || 50);

  res.json({ success: true, data: { logs } });
});
