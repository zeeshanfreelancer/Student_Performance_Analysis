import crypto from 'crypto';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  cookieOptions,
} from '../utils/tokenUtils.js';
import { logActivity } from '../services/activityLogService.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

const sendTokens = (user, res, rememberMe = false) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const accessMax = 15 * 60 * 1000;
  const refreshMax = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  res.cookie('accessToken', accessToken, cookieOptions(accessMax));
  res.cookie('refreshToken', refreshToken, cookieOptions(refreshMax));

  return { accessToken, refreshToken };
};

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role, phone, address, gender } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 400);

  const user = await User.create({ name, email, password, role, phone, address, gender });
  const tokens = sendTokens(user, res);

  await logActivity(user._id, 'REGISTER', { resource: 'User', resourceId: user._id, ip: req.ip });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: sanitizeUser(user), ...tokens },
  });
});

export const login = catchAsync(async (req, res) => {
  const { password, rememberMe } = req.body;
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.status === 'inactive') throw new AppError('Account is inactive', 403);

  if (user.role === 'student') {
    const studentProfile = await Student.findOne({ user: user._id });
    if (!studentProfile) {
      throw new AppError(
        'Student profile is missing for this account. Ask an administrator to recreate your student record.',
        403
      );
    }
    if (studentProfile.status !== 'active') {
      const messages = {
        completed: 'Your program is completed. Contact administration if you need access.',
        graduated: 'Your program is completed. Contact administration if you need access.',
        left: 'This student account is no longer active.',
        inactive: 'Student account is inactive',
      };
      throw new AppError(messages[studentProfile.status] || 'Student account is not active', 403);
    }
  }

  if (user.role === 'teacher') {
    const teacherProfile = await Teacher.findOne({ user: user._id });
    if (!teacherProfile) {
      throw new AppError(
        'Teacher profile is missing for this account. Ask an administrator to recreate your teacher record.',
        403
      );
    }
    if (teacherProfile.status === 'left') {
      throw new AppError('This teacher account is no longer active.', 403);
    }
  }

  if (user.role === 'parent') {
    const parentProfile = await Parent.findOne({ user: user._id });
    if (!parentProfile) {
      throw new AppError(
        'Parent profile is missing for this account. Ask an administrator to recreate your parent record.',
        403
      );
    }
    if (parentProfile.status === 'inactive') {
      throw new AppError('This parent account is inactive.', 403);
    }
  }

  const refreshToken = signRefreshToken(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = sendTokens(user, res, rememberMe);
  await logActivity(user._id, 'LOGIN', { ip: req.ip, userAgent: req.get('user-agent') });

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: sanitizeUser(user), ...tokens },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw new AppError('Refresh token required', 401);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

  const tokens = sendTokens(user, res, true);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: { user: sanitizeUser(user), ...tokens } });
});

export const logout = catchAsync(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    await logActivity(req.user._id, 'LOGOUT', { ip: req.ip });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = catchAsync(async (req, res) => {
  res.json({ success: true, data: { user: sanitizeUser(req.user) } });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { name, phone, address, gender } = req.body;
  const updates = { name, phone, address, gender };

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'profiles');
    updates.profileImage = result.secure_url;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await logActivity(req.user._id, 'UPDATE_PROFILE', { resource: 'User', resourceId: user._id });

  res.json({ success: true, data: { user: sanitizeUser(user) } });
});

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getResetTokenExpiry = () => {
  const minutes = parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '60', 10);
  return Date.now() + minutes * 60 * 1000;
};

export const forgotPassword = catchAsync(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const genericMessage =
    'If an account exists with this email, a password reset link has been sent.';

  const user = await User.findOne({ email }).select(
    '+passwordResetToken +passwordResetExpires'
  );

  if (!user || user.status === 'inactive') {
    return res.json({ success: true, message: genericMessage });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashResetToken(resetToken);
  user.passwordResetExpires = new Date(getResetTokenExpiry());
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  const emailResult = await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    resetUrl,
  });

  if (!emailResult.sent) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      emailResult.skipped
        ? 'Password reset email is not configured. Please contact your administrator.'
        : 'Could not send reset email. Please try again later.',
      emailResult.skipped ? 503 : 500
    );
  }

  res.json({ success: true, message: genericMessage });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = hashResetToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires +refreshToken');

  if (!user) {
    throw new AppError('Password reset link is invalid or has expired', 400);
  }

  if (user.status === 'inactive') {
    throw new AppError('This account is inactive. Contact your administrator.', 403);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = null;
  await user.save();

  await logActivity(user._id, 'RESET_PASSWORD', { resource: 'User', ip: req.ip });

  res.json({
    success: true,
    message: 'Password reset successful. You can sign in with your new password.',
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = newPassword;
  await user.save();
  await logActivity(req.user._id, 'CHANGE_PASSWORD', { resource: 'User' });
  res.json({ success: true, message: 'Password changed successfully' });
});

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  phone: user.phone,
  address: user.address,
  gender: user.gender,
  status: user.status,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});
