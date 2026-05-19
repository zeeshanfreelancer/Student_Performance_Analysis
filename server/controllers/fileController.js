import File from '../models/File.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const result = await uploadToCloudinary(req.file.buffer, req.body.folder || 'files');

  const file = await File.create({
    name: req.file.originalname,
    url: result.secure_url,
    publicId: result.public_id,
    type: req.body.type || 'other',
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
    student: req.body.student,
    class: req.body.class,
  });

  res.status(201).json({ success: true, data: { file } });
});

export const getFiles = catchAsync(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.class) filter.class = req.query.class;
  if (req.query.student) filter.student = req.query.student;

  const files = await File.find(filter)
    .populate('uploadedBy', 'name role')
    .sort('-createdAt');

  res.json({ success: true, data: { files } });
});

export const deleteFile = catchAsync(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) throw new AppError('File not found', 404);

  await deleteFromCloudinary(file.publicId);
  file.status = 'deleted';
  await file.save();

  res.json({ success: true, message: 'File deleted' });
});
