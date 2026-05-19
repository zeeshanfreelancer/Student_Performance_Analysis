import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    files: [{ url: String, publicId: String, name: String }],
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late', 'pending'],
      default: 'submitted',
    },
    grade: { type: Number },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    deadline: { type: Date, required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    attachments: [{ url: String, publicId: String, name: String }],
    submissions: [submissionSchema],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    maxMarks: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
