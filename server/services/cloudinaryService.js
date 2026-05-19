import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import { AppError } from '../utils/AppError.js';

export const uploadToCloudinary = (buffer, folder = 'school-erp') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(new AppError('File upload failed', 500));
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
};
