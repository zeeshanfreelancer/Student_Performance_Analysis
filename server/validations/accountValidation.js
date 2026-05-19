import { body } from 'express-validator';

export const createAccountValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'teacher', 'parent']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  body('gender').optional().isIn(['male', 'female', 'other', '']),
  body('profile.employeeId').optional().trim(),
  body('profile.department').optional(),
  body('profile.qualification').optional().trim(),
  body('profile.occupation').optional().trim(),
  body('profile.relation').optional().isIn(['father', 'mother', 'guardian']),
];
