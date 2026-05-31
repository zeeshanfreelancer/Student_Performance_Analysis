import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DataTable from '../../components/ui/DataTable';
import { AttendanceLineChart } from '../../charts/PerformanceCharts';
import { attendanceService } from '../../services/attendanceService';
import { formatDate } from '../../utils/helpers';
import { ATTENDANCE_STATUS } from '../../utils/constants';

const statusStyle = {
  present: ATTENDANCE_STATUS.present.color,
  absent: ATTENDANCE_STATUS.absent.color,
  late: ATTENDANCE_STATUS.late.color,
  leave: ATTENDANCE_STATUS.leave.color,
};

export default function StudentAttendanceView() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService
      .getAnalytics()
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[200px]" />;

  const records = analytics?.attendance || analytics?.calendar || [];
  const myPct = analytics?.classAverage ?? 0;
  const isLow = myPct < 75;
  const enrolledFrom = analytics?.enrollmentDate
    ? formatDate(analytics.enrollmentDate)
    : null;

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    {
      key: 'subject',
      label: 'Subject',
      render: (r) => r.subject?.name || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyle[r.status] || 'bg-gray-100'}`}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <>
      {enrolledFrom && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing attendance from your registration date ({enrolledFrom}).
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Your attendance (since enrollment)</p>
          <p className="text-3xl font-bold text-primary-600">{myPct}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Records</p>
          <p className="text-3xl font-bold text-primary-600">{records.length}</p>
        </div>
      </div>

      {isLow && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20">
          Your attendance is below 75%. Please improve regularity.
        </p>
      )}

      {analytics?.monthlyStats?.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold">Your attendance trends</h3>
          <AttendanceLineChart data={analytics.monthlyStats} />
        </div>
      )}

      <div className="card">
        <h3 className="mb-4 font-semibold">Your attendance history</h3>
        <DataTable
          columns={columns}
          data={records}
          loading={false}
          emptyTitle="No attendance records yet"
        />
      </div>
    </>
  );
}
