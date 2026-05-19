import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getDashboardPath } from '../utils/constants';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
