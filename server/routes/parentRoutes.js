import { Router } from 'express';
import * as parentController from '../controllers/parentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, restrictTo('parent'));

router.get('/dashboard', parentController.getParentDashboard);
router.get('/child/:childId', parentController.getChildProfile);

export default router;
