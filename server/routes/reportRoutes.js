import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', reportController.getReports);
router.post('/student/:studentId', restrictTo('admin', 'teacher'), reportController.generateStudentReport);

export default router;
