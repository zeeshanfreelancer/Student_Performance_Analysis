import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateSubjectModal from '../../components/subjects/CreateSubjectModal';
import AssignSubjectTeacherModal from '../../components/subjects/AssignSubjectTeacherModal';
import { subjectService } from '../../services/subjectService';
import { classService } from '../../services/classService';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignSubject, setAssignSubject] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    subjectService
      .getAll({ class: classFilter || undefined, status: 'active' })
      .then(({ data }) => setSubjects(data.data.subjects || []))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, [classFilter]);

  useEffect(() => {
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await subjectService.delete(id);
      toast.success('Subject deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => r.code },
    { key: 'name', label: 'Subject', render: (r) => r.name },
    {
      key: 'class',
      label: 'Class',
      render: (r) =>
        r.class ? `${r.class.name} ${r.class.section || ''} (${r.class.academicYear})`.trim() : '—',
    },
    { key: 'credits', label: 'Credits', render: (r) => r.credits ?? 3 },
    {
      key: 'teacher',
      label: 'Assigned teacher',
      render: (r) => r.teacher?.user?.name || '—',
    },
  ];

  if (loading && !subjects.length) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add subjects for each class, then assign them to teachers. Teachers see only their assigned subjects.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <FiPlus className="mr-2 inline" /> Add subject
        </button>
      </div>

      <select
        className="input-field sm:w-64"
        value={classFilter}
        onChange={(e) => setClassFilter(e.target.value)}
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name} {c.section} ({c.academicYear})
          </option>
        ))}
      </select>

      <DataTable
        columns={columns}
        data={subjects}
        loading={loading}
        emptyTitle="No subjects yet"
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssignSubject(row)}
              className="btn-secondary py-1.5 text-xs"
            >
              <FiUserCheck className="mr-1 inline" />
              {row.teacher ? 'Change teacher' : 'Assign teacher'}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row._id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
      />

      <CreateSubjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
      />

      <AssignSubjectTeacherModal
        open={!!assignSubject}
        subject={assignSubject}
        onClose={() => setAssignSubject(null)}
        onSuccess={load}
      />
    </div>
  );
}
