import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { subjectService } from '../../services/subjectService';
import { classService } from '../../services/classService';

export default function CreateSubjectModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { credits: 3 },
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset({ credits: 3 });
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes || []))
      .catch(() => {});
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await subjectService.create({
        name: formData.name.trim(),
        code: formData.code.trim(),
        class: formData.class,
        credits: Number(formData.credits) || 3,
      });
      toast.success('Subject added');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add subject</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Class / program</label>
            <select className="input-field" {...register('class', { required: 'Class is required' })}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.section} ({c.academicYear})
                </option>
              ))}
            </select>
            {errors.class && <p className="mt-1 text-sm text-red-500">{errors.class.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject name</label>
            <input className="input-field" placeholder="e.g. Data Structures" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject code</label>
            <input className="input-field" placeholder="e.g. CS201" {...register('code', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Credits</label>
            <input type="number" min={1} className="input-field" {...register('credits')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Add subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
