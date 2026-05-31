import { useEffect, useState } from 'react';
import { FiBook, FiCalendar, FiAward, FiFileText } from 'react-icons/fi';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DataTable from '../../components/ui/DataTable';
import { analyticsService } from '../../services/analyticsService';
import { assignmentService } from '../../services/assignmentService';
import { passStatusLabel, passStatusClass } from '../../utils/subjectMarks';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [subjectResults, setSubjectResults] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getMy(), assignmentService.getMy()])
      .then(([analyticsRes, assignRes]) => {
        setStudent(analyticsRes.data.data.student);
        setSubjectResults(analyticsRes.data.data.subjectResults || []);
        const assignments = assignRes.data.data.assignments || [];
        setPending(assignments.filter((a) => a.submissionStatus === 'pending').length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const passedCount = subjectResults.filter((r) => r.passStatus === 'pass').length;
  const failedCount = subjectResults.filter((r) => r.passStatus === 'fail').length;

  const resultColumns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (r) => r.subject?.name || '—',
    },
    {
      key: 'code',
      label: 'Code',
      render: (r) => r.subject?.code || '—',
    },
    {
      key: 'marks',
      label: 'Marks',
      render: (r) => `${r.marks} / ${r.maxMarks}`,
    },
    {
      key: 'passStatus',
      label: 'Result',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${passStatusClass(r.passStatus)}`}>
          {passStatusLabel(r.passStatus)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Welcome, {student?.user?.name || 'Student'}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="GPA" value={student?.gpa?.toFixed(2) || '0.00'} icon={FiAward} color="primary" />
        <StatCard title="Attendance" value={`${student?.attendancePercentage || 0}%`} icon={FiCalendar} color="green" />
        <StatCard title="Pending Assignments" value={pending} icon={FiFileText} color="yellow" />
        <StatCard title="Class" value={student?.class?.name || 'N/A'} icon={FiBook} color="purple" />
      </div>

      <div className="card space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Subject results</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pass if marks are above 24, fail if 24 or below.
            {subjectResults.length > 0 && (
              <> ({passedCount} pass, {failedCount} fail)</>
            )}
          </p>
        </div>
        <DataTable
          columns={resultColumns}
          data={subjectResults}
          loading={false}
          emptyTitle="No subject marks yet"
          emptyDescription="Your teacher will add marks for each subject. Results will appear here."
        />
      </div>
    </div>
  );
}
