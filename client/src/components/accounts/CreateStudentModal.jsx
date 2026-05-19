import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';

export default function CreateStudentModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes))
      .catch(() => toast.error('Failed to load classes'));
    reset();
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await studentService.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        rollNo: formData.rollNo.toUpperCase(),
        class: formData.class,
        phone: formData.phone || '',
        gender: formData.gender || '',
        fatherName: formData.fatherName || '',
        motherName: formData.motherName || '',
      });
      toast.success('Student account created');
      onSuccess?.();
      onClose();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Student Account</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input className="input-field" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input type="email" className="input-field" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input type="password" className="input-field" {...register('password', { required: true, minLength: 6 })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Roll No</label>
              <input className="input-field" {...register('rollNo', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <select className="input-field" {...register('class', { required: true })}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.section} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input className="input-field" {...register('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select className="input-field" {...register('gender')}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Father Name</label>
              <input className="input-field" {...register('fatherName')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mother Name</label>
              <input className="input-field" {...register('motherName')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
