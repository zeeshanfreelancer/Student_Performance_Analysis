import { Router } from 'express';
import * as quizController from '../controllers/quizController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/history', restrictTo('student'), quizController.getQuizHistory);
router.get('/', quizController.getQuizzes);
router.post('/', restrictTo('teacher'), quizController.createQuiz);
router.get('/:id/leaderboard', quizController.getLeaderboard);
router.get('/:id/start', restrictTo('student'), quizController.startQuiz);
router.get('/:id/review', restrictTo('student'), quizController.getQuizReview);
router.post('/:id/submit', restrictTo('student'), quizController.submitQuiz);
router.get('/:id', quizController.getQuiz);
router.patch('/:id', restrictTo('teacher'), quizController.updateQuiz);
router.delete('/:id', restrictTo('teacher'), quizController.deleteQuiz);

export default router;
