export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  leave: { label: 'Leave', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

export const STUDENT_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  left: { label: 'Left', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  graduated: { label: 'Completed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

export const TEACHER_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  left: { label: 'Left', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export const NAV_ITEMS = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/users', label: 'Users', icon: 'users' },
    { path: '/admin/teachers', label: 'Teachers', icon: 'users' },
    { path: '/admin/parents', label: 'Parents', icon: 'users' },
    { path: '/admin/classes', label: 'Classes', icon: 'classes' },
    { path: '/admin/subjects', label: 'Subjects', icon: 'subjects' },
    { path: '/admin/students', label: 'Students', icon: 'students' },
    { path: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/admin/chat', label: 'Messages', icon: 'chat' },
    { path: '/admin/activity', label: 'Activity Logs', icon: 'activity' },
  ],
  teacher: [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/teacher/students', label: 'Students', icon: 'students' },
    { path: '/teacher/attendance', label: 'Take Attendance', icon: 'attendance' },
    { path: '/teacher/marks', label: 'Subject Marks', icon: 'grades' },
    { path: '/teacher/assignments', label: 'Assignments', icon: 'assignments' },
    { path: '/teacher/quizzes', label: 'Quizzes', icon: 'quizzes' },
    { path: '/teacher/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/teacher/chat', label: 'Messages', icon: 'chat' },
  ],
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/student/profile', label: 'My Profile', icon: 'profile' },
    { path: '/student/attendance', label: 'Attendance', icon: 'attendance' },
    { path: '/student/assignments', label: 'Assignments', icon: 'assignments' },
    { path: '/student/quizzes', label: 'Quizzes', icon: 'quizzes' },
    { path: '/student/analytics', label: 'Performance', icon: 'analytics' },
    { path: '/student/chat', label: 'Messages', icon: 'chat' },
  ],
  parent: [
    { path: '/parent/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/parent/children', label: 'My Children', icon: 'students' },
    { path: '/parent/attendance', label: 'Attendance', icon: 'attendance' },
    { path: '/parent/grades', label: 'Grades', icon: 'grades' },
    { path: '/parent/chat', label: 'Messages', icon: 'chat' },
  ],
};

export const getDashboardPath = (role) => `/${role}/dashboard`;
