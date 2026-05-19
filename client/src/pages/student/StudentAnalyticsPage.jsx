import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAward, FiCalendar, FiBook } from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import { SubjectBarChart, AttendanceLineChart } from '../../charts/PerformanceCharts';
import { analyticsService } from '../../services/analyticsService';
import { formatDate } from '../../utils/helpers';

const examLabel = (type) =>
  type ? type.charAt(0).toUpperCase() + type.slice(1) : '—';

const statusStyle = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  leave: 'bg-blue-100 text-blue-800',
};

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

  const { student, results = [], subjectMarks = [], attendance = [], attendanceTrends = [] } = data;

  const chartData = subjectMarks.map((s) => ({
    name: s.name,
    marks: s.marks,
    average: s.maxMarks ? Math.round((s.marks / s.maxMarks) * 100) : s.marks,
  }));

  const resultColumns = [
    { key: 'subject', label: 'Subject', render: (r) => r.subject?.name || '—' },
    { key: 'examType', label: 'Exam', render: (r) => examLabel(r.examType) },
    { key: 'semester', label: 'Semester', render: (r) => r.semester },
    {
      key: 'marks',
      label: 'Score',
      render: (r) => `${r.marks} / ${r.maxMarks || 100}`,
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (r) => (
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
          {r.grade || '—'}
        </span>
      ),
    },
  ];

  const attendanceColumns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Performance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Class {student.class?.name} {student.class?.section} · Roll {student.rollNo}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="GPA" value={student.gpa?.toFixed(2) ?? '—'} icon={FiAward} />
        <StatCard title="Attendance" value={`${student.attendancePercentage ?? 0}%`} icon={FiCalendar} />
        <StatCard title="Subjects" value={subjectMarks.length} icon={FiBook} />
      </div>

      {subjectMarks.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold">Marks by subject</h3>
          <SubjectBarChart data={chartData} />
        </div>
      )}

      {attendanceTrends.length > 0 && (
        <div className="card">
          <h3 className="mb-4 font-semibold">Attendance trends</h3>
          <AttendanceLineChart data={attendanceTrends} />
        </div>
      )}

      <div className="card">
        <h3 className="mb-4 font-semibold">Exam results</h3>
        <DataTable
          columns={resultColumns}
          data={results}
          loading={false}
          emptyTitle="No grades recorded yet"
        />
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Recent attendance</h3>
        <DataTable
          columns={attendanceColumns}
          data={attendance}
          loading={false}
          emptyTitle="No attendance records yet"
        />
      </div>
    </div>
  );
}
