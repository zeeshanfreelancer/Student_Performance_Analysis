import { Router } from 'express';
import * as parentController from '../controllers/parentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, restrictTo('admin', 'teacher'));

router.get('/', parentController.listParents);
router.get('/:id', parentController.getParentById);
router.patch('/:id/children', parentController.updateParentChildren);

export default router;
