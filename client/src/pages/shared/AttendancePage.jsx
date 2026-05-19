import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceLineChart } from '../../charts/PerformanceCharts';
import { ATTENDANCE_STATUS } from '../../utils/constants';

export default function AttendancePage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getAnalytics()
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Attendance</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Class Average</p>
          <p className="text-3xl font-bold text-primary-600">{analytics?.classAverage || 0}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Below 75%</p>
          <p className="text-3xl font-bold text-red-600">{analytics?.lowAttendance?.length || 0}</p>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-4 font-semibold">Monthly Trends</h3>
        <AttendanceLineChart data={analytics?.monthlyStats || []} />
      </div>
      {analytics?.lowAttendance?.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-red-600">Low Attendance Alerts</h3>
          <div className="space-y-2">
            {analytics.lowAttendance.map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <span>{s.user?.name || s.name} - {s.rollNo}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${ATTENDANCE_STATUS.absent.color}`}>
                  {s.attendancePercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
