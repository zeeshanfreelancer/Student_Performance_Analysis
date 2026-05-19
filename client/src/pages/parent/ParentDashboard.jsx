import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { FiAlertTriangle, FiCalendar, FiAward } from 'react-icons/fi';
import { parentService } from '../../services/parentService';
export default function ParentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const child = data?.children?.[0];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Parent Portal</h2>
      {child && (
        <>
          <div className="card">
            <h3 className="text-lg font-semibold">{child.student?.user?.name}</h3>
            <p className="text-gray-500">Class: {child.student?.class?.name}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="GPA" value={child.student?.gpa?.toFixed(2)} icon={FiAward} />
            <StatCard title="Attendance" value={`${child.student?.attendancePercentage}%`} icon={FiCalendar} />
            <StatCard title="Alerts" value={child.alerts?.length || 0} icon={FiAlertTriangle} color="red" />
          </div>
          {child.alerts?.map((a, i) => (
            <div key={i} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-900/20">
              {a.message}
            </div>
          ))}
        </>
      )}
      {!child && <p className="text-gray-500">No children linked to your account.</p>}
    </div>
  );
}
