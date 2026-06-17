import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import CreateTeacherModal from '../../components/accounts/CreateTeacherModal';
import { teacherService } from '../../services/teacherService';
import { TEACHER_STATUS } from '../../utils/constants';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    teacherService
      .getAll({ all: 'true' })
      .then(({ data }) => setTeachers(data.data.teachers || []))
      .catch(() => toast.error('Failed to load teachers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (teacher, status) => {
    if (teacher.status === status) return;
    setUpdatingId(teacher._id);
    try {
      await teacherService.updateStatus(teacher._id, status);
      toast.success(`Teacher marked as ${TEACHER_STATUS[status]?.label || status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', render: (r) => r.employeeId || '—' },
    { key: 'name', label: 'Name', render: (r) => r.user?.name },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    { key: 'phone', label: 'Phone', render: (r) => r.user?.phone || '—' },
    {
      key: 'department',
      label: 'Department',
      render: (r) => (r.department ? `${r.department.name}` : '—'),
    },
    {
      key: 'subjects',
      label: 'Assigned subjects',
      render: (r) =>
        r.subjects?.length
          ? r.subjects.map((s) => `${s.name} (${s.class?.name || '—'})`).join(', ')
          : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const meta = TEACHER_STATUS[r.status] || { label: r.status, color: 'bg-gray-100' };
        return (
          <select
            className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${meta.color}`}
            value={r.status}
            disabled={updatingId === r._id}
            onChange={(e) => handleStatusChange(r, e.target.value)}
          >
            <option value="active">Active</option>
            <option value="left">Left</option>
          </select>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Teachers</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add teachers and manage employment status. Assign subjects on the Subjects page. Teachers marked as left cannot log in.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <FiPlus className="mr-2 inline" /> Add Teacher
        </button>
      </div>

      <DataTable columns={columns} data={teachers} loading={loading} emptyTitle="No teachers yet" />

      <CreateTeacherModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
