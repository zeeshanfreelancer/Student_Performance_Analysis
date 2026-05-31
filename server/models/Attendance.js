import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave', 'late'],
      required: true,
    },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ subject: 1, date: 1 });
attendanceSchema.index({ class: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
