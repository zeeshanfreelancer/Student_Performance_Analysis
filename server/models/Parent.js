import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    relation: String,
  },
  { _id: false }
);

const parentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    occupation: { type: String, default: '' },
    workplace: { type: String, default: '' },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    relation: { type: String, enum: ['father', 'mother', 'guardian'], default: 'guardian' },
    dob: { type: Date },
    address: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    spouseName: { type: String, default: '' },
    emergencyContact: emergencyContactSchema,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Parent', parentSchema);
