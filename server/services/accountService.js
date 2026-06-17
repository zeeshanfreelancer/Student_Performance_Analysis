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
    experience: Number(profile.experience) || 0,
    joiningDate: profile.joiningDate || new Date(),
    salary: profile.salary ? Number(profile.salary) : undefined,
    dob: profile.dob || undefined,
    address: profile.address || '',
    bloodGroup: profile.bloodGroup || '',
    emergencyContact: profile.emergencyContact,
    previousEmployment: profile.previousEmployment,
    classes: profile.classes || [],
    status: 'active',
  });

  return teacher;
};

export const createParentProfile = async (userId, profile = {}) => {
  const parent = await Parent.create({
    user: userId,
    occupation: profile.occupation || '',
    workplace: profile.workplace || '',
    relation: profile.relation || 'guardian',
    dob: profile.dob || undefined,
    address: profile.address || '',
    bloodGroup: profile.bloodGroup || '',
    alternatePhone: profile.alternatePhone || '',
    spouseName: profile.spouseName || '',
    emergencyContact: profile.emergencyContact,
    children: profile.children || [],
    status: 'active',
  });

  return parent;
};

export const updateUserCredentials = async (userId, { email, password }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User account not found', 404);

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) throw new AppError('Email is required', 400);
    const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
    if (exists) throw new AppError('Email already registered', 400);
    user.email = normalizedEmail;
  }

  if (password) {
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    user.password = password;
  }

  if (email !== undefined || password) {
    await user.save();
  }

  return user;
};
