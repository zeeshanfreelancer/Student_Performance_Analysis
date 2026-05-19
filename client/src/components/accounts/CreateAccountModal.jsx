import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { ROLE_LABELS } from '../../utils/constants';

export default function CreateAccountModal({ open, onClose, onSuccess, defaultRole = '' }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedRole = watch('role') || defaultRole;

  useEffect(() => {
    if (!open) return;
    accountService
      .getCreatableRoles()
      .then(({ data }) => setRoles(data.data.roles))
      .catch(() => toast.error('Failed to load roles'));
    reset({ role: defaultRole || '' });
  }, [open, defaultRole, reset]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const role = defaultRole || formData.role;
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: formData.phone || '',
        profile: {},
      };

      if (role === 'teacher') {
        payload.profile = {
          employeeId: formData.employeeId || undefined,
          qualification: formData.qualification || '',
        };
      }
      if (role === 'parent') {
        payload.profile = {
          occupation: formData.occupation || '',
          relation: formData.relation || 'guardian',
        };
      }

      await accountService.create(payload);
      toast.success(`${ROLE_LABELS[role] || role} account created`);
      onSuccess?.();
      onClose();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = defaultRole ? [defaultRole] : roles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {defaultRole === 'parent' ? 'Create Parent Account' : 'Create Account'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!defaultRole && (
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select className="input-field" {...register('role', { required: true })}>
                <option value="">Select role</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">Role is required</p>}
            </div>
          )}

          <div>
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
            <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
            <input className="input-field" {...register('phone')} />
          </div>

          {selectedRole === 'teacher' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Employee ID (optional)</label>
                <input className="input-field" placeholder="Auto-generated if empty" {...register('employeeId')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Qualification</label>
                <input className="input-field" {...register('qualification')} />
              </div>
            </>
          )}

          {selectedRole === 'parent' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Occupation</label>
                <input className="input-field" {...register('occupation')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Relation</label>
                <select className="input-field" {...register('relation')}>
                  <option value="guardian">Guardian</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
