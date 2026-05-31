import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.post('/mark', restrictTo('teacher'), attendanceController.markAttendance);
router.get('/analytics', attendanceController.getAttendanceAnalytics);
router.get('/subject/:subjectId', restrictTo('teacher'), attendanceController.getAttendanceBySubject);
router.get('/student/:studentId', attendanceController.getStudentAttendance);

export default router;
