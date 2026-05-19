import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { assignmentService } from '../../services/assignmentService';
import { formatDate } from '../../utils/helpers';

export default function AssignmentsPage() {
  const { user } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = user?.role === 'student'
      ? assignmentService.getMy()
      : assignmentService.getAll();
    fetch
      .then(({ data }) => setAssignments(data.data.assignments))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'deadline', label: 'Deadline', render: (r) => formatDate(r.deadline) },
    { key: 'status', label: 'Status', render: (r) => r.submissionStatus || r.status },
  ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Assignments</h2>
      <DataTable columns={columns} data={assignments} loading={false} emptyTitle="No assignments" />
    </div>
  );
}
