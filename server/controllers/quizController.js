import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const createQuiz = catchAsync(async (req, res) => {
  const totalMarks = req.body.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0;
  const quiz = await Quiz.create({ ...req.body, marks: totalMarks });
  res.status(201).json({ success: true, data: { quiz } });
});

export const getQuizzes = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.status) filter.status = req.query.status;

  const quizzes = await Quiz.find(filter)
    .populate('class', 'name section')
    .select('-questions.correctAnswer')
    .sort('-createdAt');

  res.json({ success: true, data: { quizzes } });
});

export const getQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('class', 'name section')
    .select(req.user.role === 'student' ? '-questions.correctAnswer' : '');
  if (!quiz) throw new AppError('Quiz not found', 404);
  res.json({ success: true, data: { quiz } });
});

export const startQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);
  if (quiz.status !== 'published') throw new AppError('Quiz not available', 400);

  let questions = quiz.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
    marks: q.marks,
    category: q.category,
  }));

  if (quiz.shuffleQuestions) questions = shuffle(questions);

  res.json({
    success: true,
    data: {
      quizId: quiz._id,
      title: quiz.title,
      timer: quiz.timer,
      questions,
      totalQuestions: questions.length,
    },
  });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const { answers, timeTaken } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  let score = 0;
  let totalMarks = 0;

  answers.forEach((ans) => {
    const question = quiz.questions.id(ans.questionId);
    if (!question) return;
    totalMarks += question.marks;
    if (ans.selected === question.correctAnswer) {
      score += question.marks;
    } else if (quiz.negativeMarking && ans.selected !== -1) {
      score -= quiz.negativeMarks;
    }
  });

  score = Math.max(0, score);
  const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;

  const attempt = {
    student: student._id,
    answers,
    score,
    totalMarks,
    percentage,
    timeTaken,
    completedAt: new Date(),
  };

  quiz.attempts.push(attempt);
  await quiz.save();

  res.json({
    success: true,
    data: { score, totalMarks, percentage, attempt },
  });
});

export const getLeaderboard = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate({ path: 'attempts.student', populate: { path: 'user', select: 'name' } });

  if (!quiz) throw new AppError('Quiz not found', 404);

  const leaderboard = [...quiz.attempts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((a, i) => ({
      rank: i + 1,
      student: a.student,
      score: a.score,
      percentage: a.percentage,
      completedAt: a.completedAt,
    }));

  res.json({ success: true, data: { leaderboard } });
});

export const getQuizHistory = catchAsync(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const quizzes = await Quiz.find({ 'attempts.student': student?._id })
    .select('title marks attempts')
    .sort('-createdAt');

  const history = quizzes.flatMap((q) =>
    q.attempts
      .filter((a) => a.student.toString() === student._id.toString())
      .map((a) => ({
        quizId: q._id,
        title: q.title,
        score: a.score,
        percentage: a.percentage,
        completedAt: a.completedAt,
      }))
  );

  res.json({ success: true, data: { history } });
});

export const updateQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quiz) throw new AppError('Quiz not found', 404);
  res.json({ success: true, data: { quiz } });
});

export const deleteQuiz = catchAsync(async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Quiz deleted' });
});
