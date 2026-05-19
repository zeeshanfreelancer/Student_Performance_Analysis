import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';

export default function EditStudentModal({ open, student, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !student) return;
    reset({
      name: student.user?.name || '',
      rollNo: student.rollNo || '',
      class: student.class?._id || student.class || '',
      phone: student.user?.phone || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
    });
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes || []))
      .catch(() => toast.error('Failed to load classes'));
  }, [open, student, reset]);

  if (!open || !student) return null;

  const currentClassLabel = student.class
    ? `${student.class.name} ${student.class.section || ''}`.trim()
    : '—';

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = isTeacher
        ? { class: formData.class }
        : {
            name: formData.name,
            rollNo: formData.rollNo?.toUpperCase(),
            class: formData.class,
            phone: formData.phone || '',
            fatherName: formData.fatherName || '',
            motherName: formData.motherName || '',
          };
      await studentService.update(student._id, payload);
      toast.success('Student updated');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isTeacher ? 'Change class' : 'Edit student'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <strong>{student.user?.name}</strong> ({student.rollNo}) — currently in{' '}
          <strong>{currentClassLabel}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isTeacher && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full name</label>
                <input className="input-field" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Roll no</label>
                <input className="input-field" {...register('rollNo', { required: true })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input className="input-field" {...register('phone')} />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              {isTeacher ? 'Move to class' : 'Class'}
            </label>
            {classes.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">No classes available.</p>
            ) : (
              <select className="input-field" {...register('class', { required: 'Select a class' })}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.section} ({c.academicYear})
                  </option>
                ))}
              </select>
            )}
            {errors.class && <p className="mt-1 text-sm text-red-500">{errors.class.message}</p>}
          </div>

          {!isTeacher && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Father name</label>
                <input className="input-field" {...register('fatherName')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mother name</label>
                <input className="input-field" {...register('motherName')} />
              </div>
            </>
          )}

          {isTeacher && classes.length > 1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can move this student between any of your assigned classes.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={loading || classes.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving…' : isTeacher ? 'Change class' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
