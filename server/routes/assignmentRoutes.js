import { Router } from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();
router.use(protect);

router.get('/my', restrictTo('student'), assignmentController.getStudentAssignments);
router.get('/', assignmentController.getAssignments);
router.post('/', restrictTo('admin', 'teacher'), upload.array('attachments', 5), assignmentController.createAssignment);
router.get('/:id', assignmentController.getAssignment);
router.patch('/:id', restrictTo('admin', 'teacher'), assignmentController.updateAssignment);
router.delete('/:id', restrictTo('admin', 'teacher'), assignmentController.deleteAssignment);
router.post('/:id/submit', restrictTo('student'), upload.array('files', 5), assignmentController.submitAssignment);

export default router;
