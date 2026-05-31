import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { studentService } from '../../services/studentService';
import { ROLE_LABELS } from '../../utils/constants';

export default function CreateAccountModal({ open, onClose, onSuccess, defaultRole = '' }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [roles, setRoles] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedRole = watch('role') || defaultRole;

  useEffect(() => {
    if (!open) return;
    accountService
      .getCreatableRoles()
      .then(({ data }) => setRoles(data.data.roles))
      .catch(() => toast.error('Failed to load roles'));
    reset({ role: defaultRole || '' });
    setSelectedChildren([]);
  }, [open, defaultRole, reset]);

  useEffect(() => {
    if (!open || (selectedRole !== 'parent' && defaultRole !== 'parent')) return;
    studentService
      .getAll({ limit: 500 })
      .then(({ data }) => setStudents(data.data.students || []))
      .catch(() => toast.error('Failed to load students'));
  }, [open, selectedRole, defaultRole]);

  if (!open) return null;

  const toggleChild = (id) => {
    const sid = id.toString();
    setSelectedChildren((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const role = defaultRole || formData.role;
      const payload = {
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
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
          children: selectedChildren,
        };
      }

      const { data } = await accountService.create(payload);
      const msg = data.message || `${ROLE_LABELS[role] || role} account created`;
      toast.success(msg);
      onSuccess?.();
      onClose();
      reset();
      setSelectedChildren([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = defaultRole ? [defaultRole] : roles;
  const isParent = selectedRole === 'parent' || defaultRole === 'parent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {defaultRole === 'parent'
              ? 'Create Parent Account'
              : defaultRole === 'teacher'
                ? 'Add Teacher'
                : 'Create Account'}
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

          {(selectedRole === 'teacher' || defaultRole === 'teacher') && (
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

          {isParent && (
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
              <div>
                <label className="mb-1 block text-sm font-medium">Link to students</label>
                <p className="mb-2 text-xs text-gray-500">
                  Select which student(s) belong to this parent. You can change this later from Parents page.
                </p>
                {students.length === 0 ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">No students available yet.</p>
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    {students.map((s) => (
                      <li key={s._id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                          <input
                            type="checkbox"
                            checked={selectedChildren.includes(s._id.toString())}
                            onChange={() => toggleChild(s._id)}
                          />
                          {s.user?.name} — {s.rollNo}
                          {s.class && ` (${s.class.name} ${s.class.section})`}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : defaultRole === 'teacher' ? 'Add Teacher' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
