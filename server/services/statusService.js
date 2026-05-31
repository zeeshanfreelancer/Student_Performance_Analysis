import User from '../models/User.js';

/** When profile is left/completed, disable login; re-enable when active again */
export const syncUserStatusFromProfile = async (userId, profileStatus, role) => {
  const inactiveProfileStatuses =
    role === 'teacher' ? ['left'] : ['completed', 'left'];

  const shouldDeactivate = inactiveProfileStatuses.includes(profileStatus);
  await User.findByIdAndUpdate(userId, {
    status: shouldDeactivate ? 'inactive' : 'active',
    ...(shouldDeactivate ? { refreshToken: null } : {}),
  });
};

export const TEACHER_STATUSES = ['active', 'left'];
export const STUDENT_STATUSES = ['active', 'completed', 'left'];
