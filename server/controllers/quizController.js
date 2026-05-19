import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logActivity } from '../services/activityLogService.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const resolveTeacher = async (req) => {
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) throw new AppError('Teacher profile not found', 404);
    return teacher;
  }
  if (req.user.role === 'admin') {
    if (!req.body.teacher) throw new AppError('Teacher is required', 400);
    const teacher = await Teacher.findById(req.body.teacher);
    if (!teacher) throw new AppError('Teacher not found', 404);
    return teacher;
  }
  throw new AppError('You do not have permission', 403);
};

const validateQuestions = (questions) => {
  if (!questions?.length) throw new AppError('At least one question is required', 400);
  questions.forEach((q, i) => {
    if (!q.question?.trim()) throw new AppError(`Question ${i + 1} text is required`, 400);
    if (!q.options?.length || q.options.filter((o) => o?.trim()).length < 2) {
      throw new AppError(`Question ${i + 1} needs at least 2 options`, 400);
    }
    if (q.correctAnswer == null || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
      throw new AppError(`Question ${i + 1} needs a valid correct answer`, 400);
    }
  });
};

export const createQuiz = catchAsync(async (req, res) => {
  const teacher = await resolveTeacher(req);
  const {
    title,
    description,
    questions,
    timer,
    class: classId,
    subject,
    negativeMarking,
    negativeMarks,
    shuffleQuestions,
    status,
  } = req.body;

  if (!title || !classId || !timer) {
    throw new AppError('Title, class, and timer are required', 400);
  }

  const classIds = (teacher.classes || []).map((id) => id.toString());
  if (req.user.role === 'teacher' && classIds.length && !classIds.includes(classId.toString())) {
    throw new AppError('You can only create quizzes for your assigned classes', 403);
  }

  validateQuestions(questions);

  const cleanedQuestions = questions.map((q) => ({
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()).filter(Boolean),
    correctAnswer: Number(q.correctAnswer),
    marks: Number(q.marks) || 1,
    category: q.category || 'general',
  }));

  const totalMarks = cleanedQuestions.reduce((sum, q) => sum + q.marks, 0);

  const quiz = await Quiz.create({
    title: title.trim(),
    description: description || '',
    questions: cleanedQuestions,
    timer: Number(timer),
    class: classId,
    subject: subject || undefined,
    teacher: teacher._id,
    marks: totalMarks,
    negativeMarking: !!negativeMarking,
    negativeMarks: negativeMarking ? Number(negativeMarks) || 0.25 : 0,
    shuffleQuestions: shuffleQuestions !== false,
    status: status || 'draft',
  });

  const populated = await Quiz.findById(quiz._id)
    .populate('class', 'name section')
    .populate('subject', 'name code')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } });

  await logActivity(req.user._id, 'CREATE_QUIZ', { resource: 'Quiz', resourceId: quiz._id });

  res.status(201).json({ success: true, data: { quiz: populated } });
});

export const getQuizzes = catchAsync(async (req, res) => {
  const filter = {};
  let student = null;

  if (req.user.role === 'student') {
    student = await Student.findOne({ user: req.user._id });
    if (!student) throw new AppError('Student profile not found', 404);
    filter.class = student.class;
    filter.status = 'published';
  } else {
    if (req.query.class) filter.class = req.query.class;
    if (req.query.status) filter.status = req.query.status;
  }

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) throw new AppError('Teacher profile not found', 404);
    filter.teacher = teacher._id;
  } else if (req.query.teacher) {
    filter.teacher = req.query.teacher;
  }

  const hideAnswers = req.user.role === 'student';
  const quizzes = await Quiz.find(filter)
    .populate('class', 'name section')
    .populate('subject', 'name code')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
    .select(hideAnswers ? '-questions.correctAnswer -questions.options' : '')
    .sort('-createdAt');

  const withMeta = quizzes.map((q) => {
    const doc = q.toObject();
    if (req.user.role === 'student' && student) {
      const attempt = q.attempts?.find((a) => a.student.toString() === student._id.toString());
      doc.hasAttempted = !!attempt;
      doc.myAttempt = attempt
        ? {
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt,
          }
        : null;
    } else if (req.user.role !== 'student') {
      doc.attemptCount = q.attempts?.length || 0;
    }
    return doc;
  });

  res.json({ success: true, data: { quizzes: withMeta } });
});

export const getQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('class', 'name section academicYear')
    .populate('subject', 'name code')
    .populate({ path: 'teacher', populate: { path: 'user', select: 'name email' } })
    .populate({
      path: 'attempts.student',
      select: 'rollNo user',
      populate: { path: 'user', select: 'name email' },
    });

  if (!quiz) throw new AppError('Quiz not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || quiz.teacher._id.toString() !== teacher._id.toString()) {
      throw new AppError('You do not have permission to view this quiz', 403);
    }
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || quiz.class._id.toString() !== student.class.toString()) {
      throw new AppError('You do not have permission to view this quiz', 403);
    }
  }

  const hideAnswers = req.user.role === 'student';
  const data = hideAnswers
    ? quiz.toObject({ transform: (_, ret) => {
        ret.questions = ret.questions?.map(({ correctAnswer, ...q }) => q);
        return ret;
      } })
    : quiz;

  res.json({ success: true, data: { quiz: data } });
});

export const startQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);
  if (quiz.status !== 'published') throw new AppError('Quiz not available', 400);

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);
  if (quiz.class.toString() !== student.class.toString()) {
    throw new AppError('This quiz is not for your class', 403);
  }

  let questions = quiz.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
    marks: q.marks,
    category: q.category,
  }));

  if (quiz.shuffleQuestions) questions = shuffle(questions);

  const existingAttempt = quiz.attempts?.find((a) => a.student.toString() === student._id.toString());

  res.json({
    success: true,
    data: {
      quizId: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timer: quiz.timer,
      marks: quiz.marks,
      questions,
      totalQuestions: questions.length,
      hasAttempted: !!existingAttempt,
      previousAttempt: existingAttempt
        ? {
            score: existingAttempt.score,
            totalMarks: existingAttempt.totalMarks,
            percentage: existingAttempt.percentage,
            completedAt: existingAttempt.completedAt,
          }
        : null,
    },
  });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const { answers, timeTaken } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw new AppError('Student profile not found', 404);

  if (quiz.class.toString() !== student.class.toString()) {
    throw new AppError('This quiz is not for your class', 403);
  }
  if (quiz.status !== 'published') throw new AppError('Quiz not available', 400);

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

  const existingIdx = quiz.attempts.findIndex(
    (a) => a.student.toString() === student._id.toString()
  );
  if (existingIdx >= 0) {
    quiz.attempts[existingIdx] = attempt;
  } else {
    quiz.attempts.push(attempt);
  }
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
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || quiz.teacher.toString() !== teacher._id.toString()) {
      throw new AppError('You can only edit your own quizzes', 403);
    }
  }

  if (req.body.questions) validateQuestions(req.body.questions);

  const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('class', 'name section')
    .populate('subject', 'name code');

  res.json({ success: true, data: { quiz: updated } });
});

export const deleteQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || quiz.teacher.toString() !== teacher._id.toString()) {
      throw new AppError('You can only delete your own quizzes', 403);
    }
  }

  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Quiz deleted' });
});
