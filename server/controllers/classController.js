import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getClasses = catchAsync(async (req, res) => {
  let filter = { status: 'active' };

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id }).select('classes');
    if (teacher?.classes?.length) {
      filter = { _id: { $in: teacher.classes }, status: 'active' };
    } else {
      return res.json({ success: true, data: { classes: [] } });
    }
  }

  const classes = await Class.find(filter)
    .populate('department', 'name code')
    .select('name section academicYear department')
    .sort('name section');

  res.json({ success: true, data: { classes } });
});
