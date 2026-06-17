import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    relation: String,
  },
  { _id: false }
);

const previousEmploymentSchema = new mongoose.Schema(
  {
    organization: { type: String, default: '' },
    designation: { type: String, default: '' },
    fromYear: { type: String, default: '' },
    toYear: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    qualification: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number },
    dob: { type: Date },
    address: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    emergencyContact: emergencyContactSchema,
    previousEmployment: previousEmploymentSchema,
    status: { type: String, enum: ['active', 'left'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Teacher', teacherSchema);
