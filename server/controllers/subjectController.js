import Subject from '../models/Subject.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getSubjects = catchAsync(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.class) filter.class = req.query.class;

  const subjects = await Subject.find(filter)
    .select('name code class')
    .sort('name');

  res.json({ success: true, data: { subjects } });
});
