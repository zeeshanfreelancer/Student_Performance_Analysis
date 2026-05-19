import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/dashboard', restrictTo('admin', 'teacher'), analyticsController.getDashboardStats);
router.get('/growth', restrictTo('admin', 'teacher'), analyticsController.getGrowthAnalytics);
router.get('/performance', restrictTo('admin', 'teacher'), analyticsController.getPerformanceAnalytics);
router.get('/student/:studentId', analyticsController.getStudentAnalytics);

export default router;
