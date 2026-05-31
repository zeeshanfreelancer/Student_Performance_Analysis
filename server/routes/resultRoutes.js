import { Router } from 'express';
import * as resultController from '../controllers/resultController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('teacher'));

router.get('/subject/:subjectId', resultController.getSubjectMarks);
router.post('/subject/:subjectId', resultController.saveSubjectMarks);

export default router;
