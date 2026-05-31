import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { classService } from '../../services/classService';
import { teacherService } from '../../services/teacherService';

const getAssignedTeacherIds = (classRow) => {
  if (classRow?.teachers?.length) {
    return classRow.teachers.map((t) => (t._id || t).toString());
  }
  if (classRow?.classTeacher?._id) {
    return [classRow.classTeacher._id.toString()];
  }
  return [];
};

export default function AssignTeacherModal({ open, classRow, onClose, onSuccess }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(getAssignedTeacherIds(classRow));
    teacherService
      .getAll({ all: 'true' })
      .then(({ data }) => setTeachers(data.data.teachers || []))
      .catch(() => {});
  }, [open, classRow]);

  if (!open || !classRow) return null;

  const classLabel = `${classRow.name} ${classRow.section} (${classRow.academicYear})`;

  const toggleTeacher = (id) => {
    const sid = id.toString();
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIds.length) {
      toast.error('Select at least one teacher');
      return;
    }
    setLoading(true);
    try {
      await classService.assignTeachers(classRow._id, selectedIds);
      toast.success('Teachers assigned to class');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assign teachers</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Class: <strong>{classLabel}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Teachers</label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Select one or more teachers for this class. All selected teachers can manage students and attendance.
            </p>
            {teachers.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">No teachers available. Add teachers first.</p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                {teachers.map((t) => {
                  const id = t._id.toString();
                  return (
                    <li key={t._id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleTeacher(id)}
                        />
                        <span>
                          {t.user?.name} ({t.employeeId})
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || !selectedIds.length} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Save assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
