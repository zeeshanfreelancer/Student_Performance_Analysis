import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    semester: { type: Number, required: true },
    examType: {
      type: String,
      enum: ['midterm', 'final', 'quiz', 'assignment', 'internal'],
      default: 'internal',
    },
    marks: { type: Number, required: true },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String },
    remarks: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, subject: 1, semester: 1, examType: 1 });

export default mongoose.model('Result', resultSchema);
