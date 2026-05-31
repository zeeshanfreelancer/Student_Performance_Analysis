import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { attendanceService } from '../../services/attendanceService';
import { parentService } from '../../services/parentService';
import StudentAttendanceView from '../student/StudentAttendanceView';
import MarkAttendancePanel from '../../components/attendance/MarkAttendancePanel';
import MonthlyAttendanceExport from '../../components/attendance/MonthlyAttendanceExport';
import { AttendanceLineChart } from '../../charts/PerformanceCharts';
import { ATTENDANCE_STATUS } from '../../utils/constants';
function ParentAttendanceView() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService
      .getDashboard()
      .then(({ data: res }) => {
        const list = res.data?.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedId(list[0].student._id);
        }
      })
      .catch(() => toast.error('Failed to load children'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    attendanceService
      .getAnalytics()
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => toast.error('Failed to load attendance'));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (children.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20">
        No children linked to your account.
      </p>
    );
  }

  const linkedOnly = analytics?.lowAttendance?.filter((s) =>
    children.some((c) => c.student._id === s._id || c.student._id === s._id?.toString())
  ) ?? analytics?.lowAttendance ?? [];

  return (
    <>
      {children.length > 1 && (
        <select
          className="input-field sm:w-64"
          value={selectedId || ''}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {children.map((c) => (
            <option key={c.student._id} value={c.student._id}>
              {c.student.user?.name}
            </option>
          ))}
        </select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Your children&apos;s average attendance</p>
          <p className="text-3xl font-bold text-primary-600">{analytics?.classAverage ?? 0}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Linked children</p>
          <p className="text-3xl font-bold text-primary-600">{children.length}</p>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-4 font-semibold">Attendance trends (linked children only)</h3>
        <AttendanceLineChart data={analytics?.monthlyStats || []} />
      </div>
      {linkedOnly.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold text-red-600">Low attendance alerts</h3>
          <div className="space-y-2">
            {linkedOnly.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
              >
                <span>
                  {s.user?.name || s.name} — {s.rollNo}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs ${ATTENDANCE_STATUS.absent.color}`}>
                  {s.attendancePercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AttendanceAnalyticsSummary() {
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

  return (
    <>
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
              <div
                key={s._id}
                className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
              >
                <span>
                  {s.user?.name || s.name} - {s.rollNo}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs ${ATTENDANCE_STATUS.absent.color}`}>
                  {s.attendancePercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function AttendancePage() {
  const { user } = useSelector((state) => state.auth);
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  if (isStudent) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">My Attendance</h2>
        <StudentAttendanceView />
      </div>
    );
  }

  if (isParent) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Attendance</h2>
        <ParentAttendanceView />
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Take Attendance</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a subject and mark each student present or absent for that class session.
          </p>
        </div>
        <MarkAttendancePanel />
        <MonthlyAttendanceExport />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Attendance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of attendance across the school. Teachers mark attendance from their Take Attendance page.
        </p>
      </div>
      <AttendanceAnalyticsSummary />
    </div>
  );
}
