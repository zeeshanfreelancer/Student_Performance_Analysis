import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();
router.use(protect);

router.get('/contacts', chatController.getChatContacts);
router.get('/', chatController.getMyChats);
router.post('/', chatController.getOrCreateChat);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', upload.single('image'), chatController.sendMessage);

export default router;
