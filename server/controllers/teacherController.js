import Teacher from '../models/Teacher.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getTeachers = catchAsync(async (req, res) => {
  const teachers = await Teacher.find({ status: 'active' })
    .populate('user', 'name email')
    .select('employeeId user classes')
    .sort('employeeId');

  res.json({ success: true, data: { teachers } });
});
