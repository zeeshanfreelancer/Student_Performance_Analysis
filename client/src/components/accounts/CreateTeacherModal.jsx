import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { ROLE_LABELS } from '../../utils/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </h4>
  );
}

export default function CreateTeacherModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await accountService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'teacher',
        phone: formData.phone?.trim() || '',
        gender: formData.gender || '',
        profile: {
          employeeId: formData.employeeId?.trim() || undefined,
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
        },
      });
      const msg = data.message || `${ROLE_LABELS.teacher} account created`;
      toast.success(msg);
      onSuccess?.();
      onClose();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Teacher Account</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <SectionTitle>Account & login</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full name</label>
                <input className="input-field" {...register('name', { required: 'Name is required' })} />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" className="input-field" {...register('email', { required: 'Email is required' })} />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="input-field"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Employment details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Employee ID</label>
                <input className="input-field" placeholder="Auto-generated if empty" {...register('employeeId')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Joining date</label>
                <input type="date" className="input-field" {...register('joiningDate')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Qualification</label>
                <input className="input-field" placeholder="e.g. M.Ed, PhD" {...register('qualification')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Experience (years)</label>
                <input type="number" min={0} className="input-field" defaultValue={0} {...register('experience')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Salary (optional)</label>
                <input type="number" min={0} className="input-field" {...register('salary')} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Personal information</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Date of birth</label>
                <input type="date" className="input-field" {...register('dob')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Gender</label>
                <select className="input-field" {...register('gender')}>
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input className="input-field" {...register('phone')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Blood group</label>
                <select className="input-field" {...register('bloodGroup')}>
                  <option value="">— Select —</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Home address</label>
                <textarea
                  className="input-field min-h-[72px]"
                  placeholder="Street, city, postal code"
                  {...register('address')}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Emergency contact</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Contact name</label>
                <input className="input-field" {...register('emergencyName')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contact phone</label>
                <input className="input-field" {...register('emergencyPhone')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Relation</label>
                <input className="input-field" placeholder="e.g. Spouse, Sibling" {...register('emergencyRelation')} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Previous employment</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Previous organization / school</label>
                <input className="input-field" {...register('previousOrganization')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Designation / role</label>
                <input className="input-field" placeholder="e.g. Senior Teacher" {...register('previousDesignation')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">From year</label>
                <input className="input-field" placeholder="e.g. 2018" {...register('previousFromYear')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">To year</label>
                <input className="input-field" placeholder="e.g. 2024" {...register('previousToYear')} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Reason for leaving (optional)</label>
                <input className="input-field" {...register('previousReason')} />
              </div>
            </div>
          </section>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
