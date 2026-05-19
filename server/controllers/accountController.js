import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';
import {
  assertCanCreateRole,
  createUserAccount,
  createTeacherProfile,
  createParentProfile,
} from '../services/accountService.js';

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  gender: user.gender,
  status: user.status,
  createdAt: user.createdAt,
});

export const createAccount = catchAsync(async (req, res) => {
  const { name, email, password, role, phone, gender, profile = {} } = req.body;

  assertCanCreateRole(req.user.role, role);

  const user = await createUserAccount({
    name,
    email,
    password,
    role,
    phone,
    gender,
  });

  let roleProfile = null;
  if (role === 'teacher') {
    roleProfile = await createTeacherProfile(user._id, profile);
  } else if (role === 'parent') {
    roleProfile = await createParentProfile(user._id, profile);
  }

  await logActivity(req.user._id, 'CREATE_ACCOUNT', {
    resource: 'User',
    resourceId: user._id,
    metadata: { role, createdBy: req.user.role },
  });

  res.status(201).json({
    success: true,
    message: `${role} account created successfully`,
    data: {
      user: sanitizeUser(user),
      profile: roleProfile,
    },
  });
});

export const getCreatableRoles = catchAsync(async (req, res) => {
  const roles =
    req.user.role === 'admin'
      ? ['admin', 'teacher', 'parent']
      : req.user.role === 'teacher'
        ? ['parent']
        : [];

  res.json({ success: true, data: { roles } });
});
