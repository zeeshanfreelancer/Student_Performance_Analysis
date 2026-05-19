import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { analyticsService } from '../../services/analyticsService';
import { SubjectBarChart, AttendanceLineChart, GradePieChart } from '../../charts/PerformanceCharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getPerformance()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const pieData = (data?.classAverages || []).map((s) => ({ name: s.name, value: s.average }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Performance Analytics</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Class Averages by Subject</h3>
          <SubjectBarChart data={data?.classAverages || []} />
        </div>
        <div className="card">
          <h3 className="mb-4 font-semibold">Grade Distribution</h3>
          <GradePieChart data={pieData} />
        </div>
      </div>
      <div className="card">
        <h3 className="mb-4 font-semibold">Attendance Trends</h3>
        <AttendanceLineChart data={data?.attendanceTrends || []} />
      </div>
      {data?.insights && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="mb-3 font-semibold text-red-600">At-Risk Students</h3>
            <ul className="space-y-2">
              {(data.insights.weakStudents || []).map((s) => (
                <li key={s.id} className="flex justify-between text-sm">
                  <span>{s.name} ({s.rollNo})</span>
                  <span>GPA: {s.gpa}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="mb-3 font-semibold text-yellow-600">Low Attendance</h3>
            <ul className="space-y-2">
              {(data.insights.lowAttendance || []).map((s) => (
                <li key={s.id} className="flex justify-between text-sm">
                  <span>{s.name} ({s.rollNo})</span>
                  <span>{s.attendance}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
