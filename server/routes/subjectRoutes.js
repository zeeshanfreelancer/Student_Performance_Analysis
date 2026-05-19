import { Router } from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('admin', 'teacher'));
router.get('/', subjectController.getSubjects);

export default router;
