import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    relation: String,
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rollNo: { type: String, required: true, unique: true, uppercase: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: { type: Number, default: 1, min: 1, max: 12 },
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    dob: { type: Date },
    address: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    emergencyContact: emergencyContactSchema,
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    gpa: { type: Number, default: 0, min: 0, max: 4 },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
    academicTimeline: [
      {
        title: String,
        description: String,
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['enrollment', 'promotion', 'award', 'disciplinary', 'other'] },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
