import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect, restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.get('/activity-logs', userController.getActivityLogs);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
