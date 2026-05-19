import { useEffect, useState } from 'react';
import { FiUsers, FiBook, FiUserCheck, FiCalendar, FiAward, FiAlertTriangle, FiFileText } from 'react-icons/fi';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { analyticsService } from '../../services/analyticsService';
import { GrowthAreaChart, AttendanceLineChart, SubjectBarChart } from '../../charts/PerformanceCharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [dash, grow, perf] = await Promise.all([
          analyticsService.getDashboard(),
          analyticsService.getGrowth(),
          analyticsService.getPerformance(),
        ]);
        setStats(dash.data.data);
        setGrowth(grow.data.data);
        setPerformance(perf.data.data);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load dashboard';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load dashboard"
        description={error}
      />
    );
  }

  const hasGrowthData = (growth?.studentGrowth?.length ?? 0) > 0;
  const hasAttendanceData = (performance?.attendanceTrends?.length ?? 0) > 0;
  const hasClassAverages = (performance?.classAverages?.length ?? 0) > 0;
  const topPerformers = stats?.topPerformers ?? [];
  const rankings = performance?.rankings ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Live statistics from your database
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={FiBook} color="primary" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers ?? 0} icon={FiUsers} color="green" />
        <StatCard title="Total Parents" value={stats?.totalParents ?? 0} icon={FiUserCheck} color="purple" />
        <StatCard title="Active Users" value={stats?.activeUsers ?? 0} icon={FiUsers} color="yellow" />
        <StatCard title="Avg Attendance" value={`${stats?.attendancePercentage ?? 0}%`} icon={FiCalendar} color="green" />
        <StatCard title="At-Risk (GPA < 2.0)" value={stats?.failedStudents ?? 0} icon={FiAlertTriangle} color="red" />
        <StatCard title="Open Assignments" value={stats?.pendingAssignments ?? 0} icon={FiAward} color="primary" />
        <StatCard title="Total Assignments" value={stats?.totalAssignments ?? 0} icon={FiFileText} color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Student Enrollment Growth</h3>
          {hasGrowthData ? (
            <GrowthAreaChart data={growth.studentGrowth} />
          ) : (
            <EmptyState
              title="No enrollment data yet"
              description="Student records will appear here once profiles are created."
            />
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Attendance Trends</h3>
          {hasAttendanceData ? (
            <AttendanceLineChart data={performance.attendanceTrends} />
          ) : (
            <EmptyState
              title="No attendance records"
              description="Mark attendance to see monthly trends."
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Top Performers</h3>
          {topPerformers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700">
                    <th className="pb-3 pr-4">Roll No</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Class</th>
                    <th className="pb-3 pr-4">GPA</th>
                    <th className="pb-3">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((s) => (
                    <tr key={s._id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4 font-medium">{s.rollNo}</td>
                      <td className="py-3 pr-4">{s.name || '—'}</td>
                      <td className="py-3 pr-4">{s.className || '—'}</td>
                      <td className="py-3 pr-4 text-green-600 dark:text-green-400">{(s.gpa ?? 0).toFixed(2)}</td>
                      <td className="py-3">{s.attendancePercentage ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No student profiles" description="Add students to see top performers." />
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Class Average by Subject</h3>
          {hasClassAverages ? (
            <SubjectBarChart data={performance.classAverages} />
          ) : (
            <EmptyState title="No grade data" description="Record exam results to see subject averages." />
          )}
        </div>
      </div>

      {rankings.length > 0 && (
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Student Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Roll No</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Class</th>
                  <th className="pb-3 pr-4">GPA</th>
                  <th className="pb-3">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((s, i) => (
                  <tr key={s._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{s.rollNo}</td>
                    <td className="py-3 pr-4">{s.user?.name}</td>
                    <td className="py-3 pr-4">
                      {s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : '—'}
                    </td>
                    <td className="py-3 pr-4">{(s.gpa ?? 0).toFixed(2)}</td>
                    <td className="py-3">{s.attendancePercentage ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {performance?.insights?.suggestions?.length > 0 && (
        <div className="card border-l-4 border-l-primary-500">
          <h3 className="mb-3 text-lg font-semibold">Insights</h3>
          <ul className="space-y-2">
            {performance.insights.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
