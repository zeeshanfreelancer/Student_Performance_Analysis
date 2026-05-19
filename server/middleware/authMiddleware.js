import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next(new AppError('You are not logged in', 401));

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id).select('+password');
  if (!user) return next(new AppError('User no longer exists', 401));
  if (user.status === 'inactive') return next(new AppError('Account is inactive', 403));

  req.user = user;
  next();
});

export const restrictTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission', 403));
    }
    next();
  });
