import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentPerformanceView from '../../components/student/StudentPerformanceView';
import { analyticsService } from '../../services/analyticsService';

export default function StudentAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getMy()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load performance data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (!data?.student) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Performance</h2>
        <p className="text-gray-500">Student profile not found. Contact your school admin.</p>
      </div>
    );
  }

  const { student } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Performance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Class {student.class?.name} {student.class?.section} · Roll {student.rollNo}
        </p>
      </div>
      <StudentPerformanceView data={data} />
    </div>
  );
}
