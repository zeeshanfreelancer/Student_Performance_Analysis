import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    credits: { type: Number, default: 3 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
