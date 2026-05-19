import { useEffect, useState } from 'react';
import { FiBook, FiCalendar, FiAward, FiFileText } from 'react-icons/fi';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { assignmentService } from '../../services/assignmentService';
import { useSelector } from 'react-redux';

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentService.getAll({ search: user?.email, limit: 1 }),
      assignmentService.getMy(),
    ])
      .then(async ([studentsRes, assignRes]) => {
        const student = studentsRes.data.data.students?.[0];
        if (student) {
          const { data } = await studentService.getProfile(student._id);
          setProfile(data.data);
        }
        setAssignments(assignRes.data.data.assignments || []);
      })
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const student = profile?.student;
  const pending = assignments.filter((a) => a.submissionStatus === 'pending').length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Welcome, {user?.name}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="GPA" value={student?.gpa?.toFixed(2) || '0.00'} icon={FiAward} color="primary" />
        <StatCard title="Attendance" value={`${student?.attendancePercentage || 0}%`} icon={FiCalendar} color="green" />
        <StatCard title="Pending Assignments" value={pending} icon={FiFileText} color="yellow" />
        <StatCard title="Class" value={student?.class?.name || 'N/A'} icon={FiBook} color="purple" />
      </div>
    </div>
  );
}
