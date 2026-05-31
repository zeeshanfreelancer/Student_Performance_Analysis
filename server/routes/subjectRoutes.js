import { Router } from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'teacher'), subjectController.getSubjects);
router.post('/', restrictTo('admin'), subjectController.createSubject);
router.patch('/:id', restrictTo('admin'), subjectController.updateSubject);
router.delete('/:id', restrictTo('admin'), subjectController.deleteSubject);
router.patch('/:id/assign-teacher', restrictTo('admin'), subjectController.assignSubjectTeacher);

export default router;
