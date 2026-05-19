import { Router } from 'express';
import * as exportController from '../controllers/exportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, restrictTo('admin', 'teacher'));

router.get('/students', exportController.exportStudents);
router.get('/attendance', exportController.exportAttendance);

export default router;
