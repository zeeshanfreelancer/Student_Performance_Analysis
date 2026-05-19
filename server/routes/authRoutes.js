import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  loginValidation,
  changePasswordValidation,
} from '../validations/authValidation.js';

const router = Router();

router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, upload.single('profileImage'), authController.updateProfile);
router.patch('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

export default router;
