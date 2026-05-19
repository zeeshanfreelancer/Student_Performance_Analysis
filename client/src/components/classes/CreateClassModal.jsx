import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { classService } from '../../services/classService';
import { teacherService } from '../../services/teacherService';

const currentYear = () => {
  const y = new Date().getFullYear();
  return `${y}-${String(y + 1).slice(-2)}`;
};

export default function CreateClassModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { section: 'A', academicYear: currentYear(), capacity: 40 },
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset({ section: 'A', academicYear: currentYear(), capacity: 40 });
    teacherService.getAll().then(({ data }) => setTeachers(data.data.teachers)).catch(() => {});
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await classService.create({
        name: formData.name.trim(),
        section: formData.section.trim(),
        academicYear: formData.academicYear.trim(),
        capacity: Number(formData.capacity) || 40,
        classTeacher: formData.classTeacher || undefined,
      });
      toast.success('Class created');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Class</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Class name</label>
            <input
              className="input-field"
              placeholder="e.g. 10"
              {...register('name', { required: 'Class name is required' })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Section</label>
              <input className="input-field" {...register('section', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Academic year</label>
              <input className="input-field" {...register('academicYear', { required: true })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Capacity</label>
            <input type="number" min={1} className="input-field" {...register('capacity')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Assign teacher (optional)</label>
            <select className="input-field" {...register('classTeacher')}>
              <option value="">— None —</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.user?.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating…' : 'Create class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
