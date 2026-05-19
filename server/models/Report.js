import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['student', 'semester', 'attendance', 'performance', 'analytics'],
      required: true,
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    fileUrl: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['generating', 'completed', 'failed'], default: 'generating' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
