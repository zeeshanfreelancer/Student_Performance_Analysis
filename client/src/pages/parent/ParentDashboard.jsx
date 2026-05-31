import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { FiAlertTriangle, FiCalendar, FiAward, FiBook } from 'react-icons/fi';
import { parentService } from '../../services/parentService';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService
      .getDashboard()
      .then(({ data: res }) => {
        const list = res.data?.children || [];
        setChildren(list);
        setSelectedIndex(0);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Parent Portal</h2>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20">
          No children are linked to your account. Contact the school admin to link your child.
        </p>
      </div>
    );
  }

  const child = children[selectedIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Parent Portal</h2>
        {children.length > 1 && (
          <select
            className="input-field sm:w-72"
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            {children.map((c, i) => (
              <option key={c.student._id} value={i}>
                {c.student.user?.name} — {c.student.class?.name} {c.student.class?.section}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold">{child.student?.user?.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Class {child.student?.class?.name} {child.student?.class?.section} · Roll{' '}
          {child.student?.rollNo}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="GPA" value={child.student?.gpa?.toFixed(2) ?? '—'} icon={FiAward} />
        <StatCard
          title="Attendance"
          value={`${child.student?.attendancePercentage ?? 0}%`}
          icon={FiCalendar}
        />
        <StatCard title="Active assignments" value={child.assignments ?? 0} icon={FiBook} />
        <StatCard
          title="Alerts"
          value={child.alerts?.length || 0}
          icon={FiAlertTriangle}
          color="red"
        />
      </div>

      {child.alerts?.map((a, i) => (
        <div
          key={i}
          className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          {a.message}
        </div>
      ))}

      {children.length > 1 && (
        <p className="text-xs text-gray-500">
          Showing data for your linked child only ({children.length} linked).
        </p>
      )}
    </div>
  );
}
