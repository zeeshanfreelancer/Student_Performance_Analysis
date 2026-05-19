import { useEffect, useState } from 'react';
import { FiUsers, FiBook, FiUserCheck, FiCalendar, FiAward, FiAlertTriangle } from 'react-icons/fi';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { analyticsService } from '../../services/analyticsService';
import { GrowthAreaChart, AttendanceLineChart } from '../../charts/PerformanceCharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, grow, perf] = await Promise.all([
          analyticsService.getDashboard(),
          analyticsService.getGrowth(),
          analyticsService.getPerformance(),
        ]);
        setStats(dash.data.data);
        setGrowth(grow.data.data);
        setPerformance(perf.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={FiBook} color="primary" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon={FiUsers} color="green" />
        <StatCard title="Total Parents" value={stats?.totalParents || 0} icon={FiUserCheck} color="purple" />
        <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={FiUsers} color="yellow" />
        <StatCard title="Attendance %" value={`${stats?.attendancePercentage || 0}%`} icon={FiCalendar} color="green" />
        <StatCard title="Failed Students" value={stats?.failedStudents || 0} icon={FiAlertTriangle} color="red" />
        <StatCard title="Pending Assignments" value={stats?.pendingAssignments || 0} icon={FiAward} color="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">User Growth</h3>
          <GrowthAreaChart data={growth?.studentGrowth || []} />
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">Attendance Trends</h3>
          <AttendanceLineChart data={performance?.attendanceTrends || []} />
        </div>
      </div>

      {performance?.insights?.suggestions?.length > 0 && (
        <div className="card border-l-4 border-l-primary-500">
          <h3 className="mb-3 text-lg font-semibold">AI Insights</h3>
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
