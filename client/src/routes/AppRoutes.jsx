import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentsPage from '../pages/admin/StudentsPage';
import ClassesPage from '../pages/admin/ClassesPage';
import ProfilePage from '../pages/shared/ProfilePage';
import ChatPage from '../pages/shared/ChatPage';
import AnalyticsPage from '../pages/shared/AnalyticsPage';
import AttendancePage from '../pages/shared/AttendancePage';
import AssignmentsPage from '../pages/shared/AssignmentsPage';
import QuizzesPage from '../pages/shared/QuizzesPage';
import TakeQuizPage from '../pages/student/TakeQuizPage';
import UsersPage from '../pages/admin/UsersPage';
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentGradesPage from '../pages/parent/ParentGradesPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentAnalyticsPage from '../pages/student/StudentAnalyticsPage';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import { getDashboardPath } from '../utils/constants';

function RoleRedirect() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

const adminRoutes = [
  { path: 'dashboard', element: <AdminDashboard /> },
  { path: 'users', element: <UsersPage /> },
  { path: 'classes', element: <ClassesPage /> },
  { path: 'students', element: <StudentsPage /> },
  { path: 'attendance', element: <AttendancePage /> },
  { path: 'analytics', element: <AnalyticsPage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
  { path: 'quizzes', element: <QuizzesPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'reports', element: <AnalyticsPage /> },
  { path: 'activity', element: <UsersPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'settings', element: <ProfilePage /> },
];

const teacherRoutes = [
  { path: 'dashboard', element: <TeacherDashboard /> },
  { path: 'students', element: <StudentsPage /> },
  { path: 'attendance', element: <AttendancePage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
  { path: 'quizzes', element: <QuizzesPage /> },
  { path: 'analytics', element: <AnalyticsPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'settings', element: <ProfilePage /> },
];

const studentRoutes = [
  { path: 'dashboard', element: <StudentDashboard /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'attendance', element: <AttendancePage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
  { path: 'quizzes', element: <QuizzesPage /> },
  { path: 'quizzes/:quizId', element: <TakeQuizPage /> },
  { path: 'analytics', element: <StudentAnalyticsPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'settings', element: <ProfilePage /> },
];

const parentRoutes = [
  { path: 'dashboard', element: <ParentDashboard /> },
  { path: 'children', element: <ParentDashboard /> },
  { path: 'attendance', element: <AttendancePage /> },
  { path: 'grades', element: <ParentGradesPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'settings', element: <ProfilePage /> },
];

function RoleRoutes({ routes, role }) {
  return (
    <Route
      path={`/${role}/*`}
      element={
        <ProtectedRoute roles={[role]}>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      {routes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
      <Route index element={<Navigate to="dashboard" replace />} />
    </Route>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
      </Route>
      <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        {adminRoutes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/teacher/*" element={<ProtectedRoute roles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
        {teacherRoutes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/student/*" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
        {studentRoutes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/parent/*" element={<ProtectedRoute roles={['parent']}><DashboardLayout /></ProtectedRoute>}>
        {parentRoutes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
