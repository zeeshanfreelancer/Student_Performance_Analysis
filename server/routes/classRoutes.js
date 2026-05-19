import { Router } from 'express';
import * as classController from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('admin', 'teacher'));
router.get('/', classController.getClasses);

export default router;
