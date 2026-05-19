import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiAward, FiCalendar, FiBook } from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import { SubjectBarChart } from '../../charts/PerformanceCharts';
import { parentService } from '../../services/parentService';

const examLabel = (type) =>
  type ? type.charAt(0).toUpperCase() + type.slice(1) : '—';

export default function ParentGradesPage() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  useEffect(() => {
    parentService
      .getDashboard()
      .then(({ data }) => {
        const list = data.data.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedId(list[0].student._id);
        }
      })
      .catch(() => toast.error('Failed to load children'))
      .finally(() => setLoading(false));
  }, []);

  const loadChildGrades = useCallback(async (childId) => {
    if (!childId) return;
    setLoadingChild(true);
    try {
      const { data } = await parentService.getChild(childId);
      setChildData(data.data);
    } catch {
      toast.error('Failed to load grades');
      setChildData(null);
    } finally {
      setLoadingChild(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadChildGrades(selectedId);
  }, [selectedId, loadChildGrades]);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grades</h2>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20">
          No children are linked to your account. Contact the school admin to link your child.
        </p>
      </div>
    );
  }

  const student = childData?.student;
  const results = childData?.results || [];
  const subjectMarks = childData?.subjectMarks || [];

  const chartData = subjectMarks.map((s) => ({
    name: s.name,
    marks: s.marks,
    average: s.maxMarks ? Math.round((s.marks / s.maxMarks) * 100) : s.marks,
  }));

  const columns = [
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Grades & Performance</h2>
        {children.length > 1 && (
          <select
            className="input-field sm:w-64"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {children.map((c) => (
              <option key={c.student._id} value={c.student._id}>
                {c.student.user?.name} — {c.student.class?.name} {c.student.class?.section}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingChild ? (
        <LoadingSpinner className="min-h-[200px]" />
      ) : student ? (
        <>
          <div className="card">
            <h3 className="text-lg font-semibold">{student.user?.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Class {student.class?.name} {student.class?.section} · Roll {student.rollNo}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="GPA"
              value={student.gpa?.toFixed(2) ?? '—'}
              icon={FiAward}
            />
            <StatCard
              title="Attendance"
              value={`${student.attendancePercentage ?? 0}%`}
              icon={FiCalendar}
            />
            <StatCard
              title="Subjects"
              value={subjectMarks.length}
              icon={FiBook}
            />
          </div>

          {subjectMarks.length > 0 ? (
            <div className="card">
              <h3 className="mb-4 font-semibold">Marks by subject</h3>
              <SubjectBarChart data={chartData} />
            </div>
          ) : null}

          <div className="card">
            <h3 className="mb-4 font-semibold">All results</h3>
            <DataTable
              columns={columns}
              data={results}
              loading={false}
              emptyTitle="No grades recorded yet"
            />
          </div>
        </>
      ) : (
        <p className="text-gray-500">Could not load grade data.</p>
      )}
    </div>
  );
}
