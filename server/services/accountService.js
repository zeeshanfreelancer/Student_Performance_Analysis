import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Parent from '../models/Parent.js';
import { AppError } from '../utils/AppError.js';

const ROLE_CREATORS = {
  admin: ['admin', 'teacher', 'parent'],
  teacher: ['parent'],
};

export const assertCanCreateRole = (creatorRole, targetRole) => {
  const allowed = ROLE_CREATORS[creatorRole];
  if (!allowed?.includes(targetRole)) {
    throw new AppError(`You cannot create ${targetRole} accounts`, 403);
  }
};

export const createUserAccount = async ({
  name,
  email,
  password,
  role,
  phone = '',
  gender = '',
  status = 'active',
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError('Email already registered', 400);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    phone,
    gender,
    status,
  });

  return user;
};

export const createTeacherProfile = async (userId, profile = {}) => {
  const employeeId =
    profile.employeeId ||
    `TCH${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const existing = await Teacher.findOne({ employeeId });
  if (existing) throw new AppError('Employee ID already exists', 400);

  const teacher = await Teacher.create({
    user: userId,
    employeeId,
    department: profile.department || undefined,
    qualification: profile.qualification || '',
    experience: profile.experience || 0,
    classes: profile.classes || [],
    status: 'active',
  });

  return teacher;
};

export const createParentProfile = async (userId, profile = {}) => {
  const parent = await Parent.create({
    user: userId,
    occupation: profile.occupation || '',
    relation: profile.relation || 'guardian',
    emergencyContact: profile.emergencyContact || '',
    children: profile.children || [],
    status: 'active',
  });

  return parent;
};
