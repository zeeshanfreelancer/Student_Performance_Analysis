import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    occupation: { type: String, default: '' },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    emergencyContact: { type: String, default: '' },
    relation: { type: String, enum: ['father', 'mother', 'guardian'], default: 'guardian' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Parent', parentSchema);
