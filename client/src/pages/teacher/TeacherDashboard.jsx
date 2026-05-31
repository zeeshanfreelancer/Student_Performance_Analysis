import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark, FiCalendar, FiEdit3, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { subjectService } from '../../services/subjectService';
import { analyticsService } from '../../services/analyticsService';
import { getMaxMarksFromCredits } from '../../utils/subjectMarks';

export default function TeacherDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      subjectService.getAll({ status: 'active' }),
      analyticsService.getDashboard(),
    ])
      .then(([subRes, dashRes]) => {
        setSubjects(subRes.data.data.subjects || []);
        setStats(dashRes.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your assigned subjects, attendance, and marks entry
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Assigned subjects" value={subjects.length} icon={FiBookmark} color="primary" />
        <StatCard title="My students" value={stats?.totalStudents ?? 0} icon={FiUsers} color="green" />
        <StatCard title="Avg attendance" value={`${stats?.attendancePercentage ?? 0}%`} icon={FiCalendar} color="purple" />
        <StatCard title="Open assignments" value={stats?.pendingAssignments ?? 0} icon={FiEdit3} color="yellow" />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">My subjects</h3>
        {!subjects.length ? (
          <div className="card rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            No subjects assigned yet. Ask an admin to add subjects and assign them to you.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const maxMarks = getMaxMarksFromCredits(s.credits);
              return (
                <div key={s._id} className="card flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.code}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {s.class ? `${s.class.name} ${s.class.section || ''} (${s.class.academicYear})` : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary-100 px-2 py-1 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                      {s.credits ?? 3} credit{(s.credits ?? 3) !== 1 ? 's' : ''}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Max {maxMarks} marks
                    </span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link
                      to={`/teacher/attendance?subject=${s._id}`}
                      className="btn-secondary flex-1 py-1.5 text-center text-xs"
                    >
                      <FiCalendar className="mr-1 inline" />
                      Attendance
                    </Link>
                    <Link
                      to={`/teacher/marks?subject=${s._id}`}
                      className="btn-primary flex-1 py-1.5 text-center text-xs"
                    >
                      <FiEdit3 className="mr-1 inline" />
                      Enter marks
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
