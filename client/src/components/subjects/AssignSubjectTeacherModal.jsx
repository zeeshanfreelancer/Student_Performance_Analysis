import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';

export default function AssignSubjectTeacherModal({ open, subject, onClose, onSuccess }) {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !subject) return;
    setTeacherId(subject.teacher?._id || '');
    teacherService
      .getAll({ all: 'true' })
      .then(({ data }) => setTeachers(data.data.teachers || []))
      .catch(() => {});
  }, [open, subject]);

  if (!open || !subject) return null;

  const classLabel = subject.class
    ? `${subject.class.name} ${subject.class.section || ''}`.trim()
    : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subjectService.assignTeacher(subject._id, teacherId || null);
      toast.success(teacherId ? 'Teacher assigned to subject' : 'Teacher unassigned');
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
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assign teacher</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <strong>{subject.name}</strong> ({subject.code}) — {classLabel}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Teacher</label>
            <select
              className="input-field"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.user?.name} ({t.employeeId})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              A teacher can teach multiple subjects. The class is linked automatically from this subject.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
