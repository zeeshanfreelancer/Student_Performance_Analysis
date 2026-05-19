import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(protect);

router.get('/search/advanced', restrictTo('admin', 'teacher'), studentController.advancedSearch);
router.get('/', restrictTo('admin', 'teacher'), studentController.getStudents);
router.post('/', restrictTo('admin', 'teacher'), upload.single('profileImage'), studentController.createStudent);
router.get('/:id/profile', studentController.getStudentProfile);
router.get('/:id', studentController.getStudent);
router.patch('/:id', restrictTo('admin', 'teacher'), upload.single('profileImage'), studentController.updateStudent);
router.delete('/:id', restrictTo('admin'), studentController.deleteStudent);

export default router;
