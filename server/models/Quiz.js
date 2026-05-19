import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    marks: { type: Number, default: 1 },
    category: { type: String, default: 'general' },
  },
  { _id: true }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    answers: [{ questionId: mongoose.Schema.Types.ObjectId, selected: Number }],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
    timeTaken: { type: Number },
  },
  { timestamps: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    questions: [questionSchema],
    timer: { type: Number, required: true },
    marks: { type: Number, default: 0 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarks: { type: Number, default: 0.25 },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    shuffleQuestions: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    attempts: [quizAttemptSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
