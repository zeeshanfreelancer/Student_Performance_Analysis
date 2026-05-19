import { Router } from 'express';
import * as accountController from '../controllers/accountController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createAccountValidation } from '../validations/accountValidation.js';

const router = Router();

router.use(protect, restrictTo('admin', 'teacher'));

router.get('/roles', accountController.getCreatableRoles);
router.post('/', createAccountValidation, validate, accountController.createAccount);

export default router;
