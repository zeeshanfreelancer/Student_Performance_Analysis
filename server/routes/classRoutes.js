import { Router } from 'express';
import * as classController from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'teacher'), classController.getClasses);
router.post('/', restrictTo('admin'), classController.createClass);
router.patch('/:id', restrictTo('admin'), classController.updateClass);
router.post('/:id/assign-teacher', restrictTo('admin'), classController.assignTeacher);
router.delete('/:id', restrictTo('admin'), classController.deleteClass);

export default router;
