import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateClassModal from '../../components/classes/CreateClassModal';
import { classService } from '../../services/classService';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this class? It must have no students.')) return;
    try {
      await classService.delete(id);
      toast.success('Class deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Class',
      render: (r) => `${r.name} ${r.section}`,
    },
    { key: 'academicYear', label: 'Year' },
    { key: 'studentCount', label: 'Students', render: (r) => r.studentCount ?? 0 },
    { key: 'capacity', label: 'Capacity' },
  ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create classes and programs (e.g. BSCS). Add subjects for each class on the Subjects page, then assign them to teachers.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <FiPlus className="mr-2 inline" /> Add class
        </button>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        loading={false}
        emptyTitle="No classes yet"
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleDelete(row._id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
              title="Delete class"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
      />

      <CreateClassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
