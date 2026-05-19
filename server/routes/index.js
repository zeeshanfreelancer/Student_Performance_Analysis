import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import studentRoutes from './studentRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import quizRoutes from './quizRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import parentRoutes from './parentRoutes.js';
import chatRoutes from './chatRoutes.js';
import reportRoutes from './reportRoutes.js';
import fileRoutes from './fileRoutes.js';
import exportRoutes from './exportRoutes.js';
import accountRoutes from './accountRoutes.js';
import classRoutes from './classRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import teacherRoutes from './teacherRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/quizzes', quizRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/parent', parentRoutes);
router.use('/chat', chatRoutes);
router.use('/reports', reportRoutes);
router.use('/files', fileRoutes);
router.use('/export', exportRoutes);
router.use('/accounts', accountRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/teachers', teacherRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'School ERP API is running' });
});

export default router;
