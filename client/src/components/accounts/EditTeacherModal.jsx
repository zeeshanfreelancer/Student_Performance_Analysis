import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { teacherService } from '../../services/teacherService';
import LoadingSpinner from '../ui/LoadingSpinner';
import AccountCredentialsFields from './AccountCredentialsFields';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </h4>
  );
}

export default function EditTeacherModal({ open, teacherId, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open || !teacherId) return;
    setLoadingData(true);
    teacherService
      .getById(teacherId)
      .then(({ data }) => {
        const t = data.data.teacher;
        reset({
          name: t.user?.name || '',
          email: t.user?.email || '',
          password: '',
          phone: t.user?.phone || '',
          gender: t.user?.gender || '',
          employeeId: t.employeeId || '',
          joiningDate: toDateInput(t.joiningDate),
          qualification: t.qualification || '',
          experience: t.experience ?? 0,
          salary: t.salary ?? '',
          dob: toDateInput(t.dob),
          address: t.address || '',
          bloodGroup: t.bloodGroup || '',
          emergencyName: t.emergencyContact?.name || '',
          emergencyPhone: t.emergencyContact?.phone || '',
          emergencyRelation: t.emergencyContact?.relation || '',
          previousOrganization: t.previousEmployment?.organization || '',
          previousDesignation: t.previousEmployment?.designation || '',
          previousFromYear: t.previousEmployment?.fromYear || '',
          previousToYear: t.previousEmployment?.toYear || '',
          previousReason: t.previousEmployment?.reason || '',
        });
      })
      .catch(() => toast.error('Failed to load teacher'))
      .finally(() => setLoadingData(false));
  }, [open, teacherId, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await teacherService.update(teacherId, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        ...(formData.password ? { password: formData.password } : {}),
        phone: formData.phone || '',
        gender: formData.gender || '',
        employeeId: formData.employeeId?.trim(),
        qualification: formData.qualification?.trim() || '',
        experience: formData.experience ? Number(formData.experience) : 0,
        joiningDate: formData.joiningDate || undefined,
        salary: formData.salary ? Number(formData.salary) : undefined,
        dob: formData.dob || undefined,
        address: formData.address?.trim() || '',
        bloodGroup: formData.bloodGroup || '',
        emergencyContact: {
          name: formData.emergencyName?.trim() || '',
          phone: formData.emergencyPhone?.trim() || '',
          relation: formData.emergencyRelation?.trim() || '',
        },
        previousEmployment: {
          organization: formData.previousOrganization?.trim() || '',
          designation: formData.previousDesignation?.trim() || '',
          fromYear: formData.previousFromYear?.trim() || '',
          toYear: formData.previousToYear?.trim() || '',
          reason: formData.previousReason?.trim() || '',
        },
      });
      toast.success('Teacher updated');
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Teacher</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        {loadingData ? (
          <LoadingSpinner className="min-h-[200px]" />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
              <SectionTitle>Account</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Full name</label>
                  <input className="input-field" {...register('name', { required: true })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input className="input-field" {...register('phone')} />
                </div>
              </div>
              <AccountCredentialsFields register={register} errors={errors} />
            </section>

            <section className="space-y-4">
              <SectionTitle>Employment</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Employee ID</label>
                  <input className="input-field" {...register('employeeId', { required: true })} />
                  {errors.employeeId && <p className="mt-1 text-sm text-red-500">Required</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Joining date</label>
                  <input type="date" className="input-field" {...register('joiningDate')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Qualification</label>
                  <input className="input-field" {...register('qualification')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Experience (years)</label>
                  <input type="number" min={0} className="input-field" {...register('experience')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Salary</label>
                  <input type="number" min={0} className="input-field" {...register('salary')} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Personal</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Date of birth</label>
                  <input type="date" className="input-field" {...register('dob')} />
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
                  <label className="mb-1 block text-sm font-medium">Blood group</label>
                  <select className="input-field" {...register('bloodGroup')}>
                    <option value="">—</option>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Address</label>
                  <textarea className="input-field min-h-[72px]" {...register('address')} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Emergency contact</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input className="input-field" {...register('emergencyName')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input className="input-field" {...register('emergencyPhone')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Relation</label>
                  <input className="input-field" {...register('emergencyRelation')} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Previous employment</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Organization</label>
                  <input className="input-field" {...register('previousOrganization')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Designation</label>
                  <input className="input-field" {...register('previousDesignation')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">From year</label>
                  <input className="input-field" {...register('previousFromYear')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">To year</label>
                  <input className="input-field" {...register('previousToYear')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Reason for leaving</label>
                  <input className="input-field" {...register('previousReason')} />
                </div>
              </div>
            </section>

            <div className="flex gap-3 border-t pt-4 dark:border-gray-700">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
