import { Router } from 'express';
import * as teacherController from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacher);
router.patch('/:id/status', teacherController.updateTeacherStatus);
router.patch('/:id', teacherController.updateTeacher);

export default router;
