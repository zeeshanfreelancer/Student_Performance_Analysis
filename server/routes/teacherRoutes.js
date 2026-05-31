import { Router } from 'express';
import * as teacherController from '../controllers/teacherController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', teacherController.getTeachers);
router.patch('/:id/status', teacherController.updateTeacherStatus);

export default router;
