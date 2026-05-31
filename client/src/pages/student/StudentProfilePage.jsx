import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentPerformanceView from '../../components/student/StudentPerformanceView';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getMy()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load your profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (!data?.student) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Profile</h2>
        <p className="text-gray-500">Student profile not found. Contact your school admin.</p>
      </div>
    );
  }

  const { student } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
              {getInitials(user?.name)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{student.user?.name || user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Roll {student.rollNo} · Class {student.class?.name} {student.class?.section}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Link to="/student/settings" className="btn-secondary text-sm">
          Account settings
        </Link>
      </div>

      <StudentPerformanceView data={data} />
    </div>
  );
}
