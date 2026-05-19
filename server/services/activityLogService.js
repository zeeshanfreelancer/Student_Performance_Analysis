import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, options = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resource: options.resource || '',
      resourceId: options.resourceId,
      ip: options.ip || '',
      userAgent: options.userAgent || '',
      metadata: options.metadata || {},
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};
