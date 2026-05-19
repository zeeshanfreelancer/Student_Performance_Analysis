import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { FiPlus, FiUpload, FiTrash2, FiEye } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateAssignmentModal from '../../components/assignments/CreateAssignmentModal';
import SubmitAssignmentModal from '../../components/assignments/SubmitAssignmentModal';
import ViewAssignmentModal from '../../components/assignments/ViewAssignmentModal';
import { assignmentService } from '../../services/assignmentService';
import { formatDate, formatDateTime } from '../../utils/helpers';

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-green-100 text-green-800',
    late: 'bg-red-100 text-red-800',
    graded: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

export default function AssignmentsPage() {
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === 'student';
  const canCreate = user?.role === 'admin' || user?.role === 'teacher';
  const canViewDetails = canCreate;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewId, setViewId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fetch = isStudent ? assignmentService.getMy() : assignmentService.getAll();
    fetch
      .then(({ data }) => setAssignments(data.data.assignments))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [isStudent]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await assignmentService.delete(id);
      toast.success('Assignment deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const openSubmit = (row) => {
    setSelected(row);
    setSubmitOpen(true);
  };

  const openView = (row) => {
    setViewId(row._id);
    setViewOpen(true);
  };

  const columns = isStudent
    ? [
        { key: 'title', label: 'Title' },
        { key: 'subject', label: 'Subject', render: (r) => r.subject?.name || '—' },
        { key: 'deadline', label: 'Deadline', render: (r) => formatDateTime(r.deadline) },
        { key: 'submissionStatus', label: 'Your Status', render: (r) => statusBadge(r.submissionStatus || 'pending') },
        { key: 'maxMarks', label: 'Marks', render: (r) => r.maxMarks },
      ]
    : [
        { key: 'title', label: 'Title' },
        { key: 'class', label: 'Class', render: (r) => r.class ? `${r.class.name} ${r.class.section || ''}`.trim() : '—' },
        { key: 'deadline', label: 'Deadline', render: (r) => formatDate(r.deadline) },
        { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
        {
          key: 'submissions',
          label: 'Submissions',
          render: (r) => `${r.submissions?.length || 0}`,
        },
      ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Assignments</h2>
        {canCreate && (
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
            <FiPlus className="mr-2 inline" /> Create Assignment
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        loading={false}
        emptyTitle="No assignments"
        onRowClick={canViewDetails ? openView : undefined}
        actions={(row) => (
          <div className="flex justify-end gap-2">
            {canViewDetails && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openView(row); }}
                className="btn-secondary py-1.5 text-xs"
                title="View assignment"
              >
                <FiEye className="mr-1 inline" /> View
              </button>
            )}
            {isStudent && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openSubmit(row); }}
                className="btn-primary py-1.5 text-xs"
                title={row.submissionStatus === 'pending' ? 'Submit' : 'Update submission'}
              >
                <FiUpload className="mr-1 inline" />
                {row.submissionStatus === 'pending' ? 'Submit' : 'Resubmit'}
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                title="Delete"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        )}
      />

      <CreateAssignmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
      />

      <SubmitAssignmentModal
        open={submitOpen}
        assignment={selected}
        onClose={() => { setSubmitOpen(false); setSelected(null); }}
        onSuccess={load}
      />

      <ViewAssignmentModal
        open={viewOpen}
        assignmentId={viewId}
        onClose={() => { setViewOpen(false); setViewId(null); }}
      />
    </div>
  );
}
