import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { accountService } from '../../services/accountService';
import { studentService } from '../../services/studentService';
import { ROLE_LABELS } from '../../utils/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </h4>
  );
}

export default function CreateParentModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [students, setStudents] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset();
    setSelectedChildren([]);
    studentService
      .getAll({ limit: 500 })
      .then(({ data }) => setStudents(data.data.students || []))
      .catch(() => toast.error('Failed to load students'));
  }, [open, reset]);

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
      const { data } = await accountService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'parent',
        phone: formData.phone?.trim() || '',
        gender: formData.gender || '',
        profile: {
          relation: formData.relation || 'guardian',
          occupation: formData.occupation?.trim() || '',
          workplace: formData.workplace?.trim() || '',
          dob: formData.dob || undefined,
          address: formData.address?.trim() || '',
          bloodGroup: formData.bloodGroup || '',
          alternatePhone: formData.alternatePhone?.trim() || '',
          spouseName: formData.spouseName?.trim() || '',
          emergencyContact: {
            name: formData.emergencyName?.trim() || '',
            phone: formData.emergencyPhone?.trim() || '',
            relation: formData.emergencyRelation?.trim() || '',
          },
          children: selectedChildren,
        },
      });
      const msg = data.message || `${ROLE_LABELS.parent} account created`;
      toast.success(msg);
      onSuccess?.();
      onClose();
      reset();
      setSelectedChildren([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Parent Account</h3>
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
            <SectionTitle>Personal information</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Relation to student</label>
                <select className="input-field" {...register('relation')}>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
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
                <label className="mb-1 block text-sm font-medium">Alternate phone</label>
                <input className="input-field" {...register('alternatePhone')} />
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
              <div>
                <label className="mb-1 block text-sm font-medium">Spouse name (optional)</label>
                <input className="input-field" {...register('spouseName')} />
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
            <SectionTitle>Work details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Occupation</label>
                <input className="input-field" placeholder="e.g. Engineer, Teacher" {...register('occupation')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Workplace / organization</label>
                <input className="input-field" {...register('workplace')} />
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
                <input className="input-field" placeholder="e.g. Relative, Neighbor" {...register('emergencyRelation')} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Link to students</SectionTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select which student(s) this parent can view in their portal (grades, attendance, messages).
            </p>
            {students.length === 0 ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">No students available yet. Create students first.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
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
            {selectedChildren.length > 0 && (
              <p className="text-xs text-gray-500">{selectedChildren.length} student(s) selected</p>
            )}
          </section>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Parent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
