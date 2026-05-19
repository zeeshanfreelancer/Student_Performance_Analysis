import { useEffect, useState } from 'react';
import { FiBook, FiCalendar, FiAward, FiFileText } from 'react-icons/fi';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { analyticsService } from '../../services/analyticsService';
import { assignmentService } from '../../services/assignmentService';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsService.getMy(), assignmentService.getMy()])
      .then(([analyticsRes, assignRes]) => {
        setStudent(analyticsRes.data.data.student);
        const assignments = assignRes.data.data.assignments || [];
        setPending(assignments.filter((a) => a.submissionStatus === 'pending').length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Welcome, {student?.user?.name || 'Student'}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="GPA" value={student?.gpa?.toFixed(2) || '0.00'} icon={FiAward} color="primary" />
        <StatCard title="Attendance" value={`${student?.attendancePercentage || 0}%`} icon={FiCalendar} color="green" />
        <StatCard title="Pending Assignments" value={pending} icon={FiFileText} color="yellow" />
        <StatCard title="Class" value={student?.class?.name || 'N/A'} icon={FiBook} color="purple" />
      </div>
    </div>
  );
}
