import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { parentService } from '../../services/parentService';
import { studentService } from '../../services/studentService';
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

export default function EditParentModal({ open, parentId, onClose, onSuccess, mode = 'full' }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const linksOnly = mode === 'links';

  useEffect(() => {
    if (!open || !parentId) return;
    setLoadingData(true);
    Promise.all([
      parentService.getById(parentId),
      studentService.getAll({ limit: 500 }),
    ])
      .then(([parentRes, studentsRes]) => {
        const p = parentRes.data.data.parent;
        const linked = (p.children || []).map((c) => (c._id || c).toString());
        setSelected(linked);
        reset({
          name: p.user?.name || '',
          email: p.user?.email || '',
          password: '',
          phone: p.user?.phone || '',
          gender: p.user?.gender || '',
          relation: p.relation || 'guardian',
          occupation: p.occupation || '',
          workplace: p.workplace || '',
          dob: toDateInput(p.dob),
          address: p.address || '',
          bloodGroup: p.bloodGroup || '',
          alternatePhone: p.alternatePhone || '',
          spouseName: p.spouseName || '',
          emergencyName: p.emergencyContact?.name || '',
          emergencyPhone: p.emergencyContact?.phone || '',
          emergencyRelation: p.emergencyContact?.relation || '',
        });
        setStudents(studentsRes.data.data.students || []);
      })
      .catch(() => toast.error('Failed to load parent'))
      .finally(() => setLoadingData(false));
  }, [open, parentId, reset]);

  if (!open) return null;

  const toggleStudent = (id) => {
    const sid = id.toString();
    setSelected((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };

  const saveLinks = async () => {
    setSavingLinks(true);
    try {
      const { data } = await parentService.updateChildren(parentId, selected);
      toast.success(data.message || 'Students linked');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update links');
    } finally {
      setSavingLinks(false);
    }
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await parentService.update(parentId, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        ...(formData.password ? { password: formData.password } : {}),
        phone: formData.phone || '',
        gender: formData.gender || '',
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
      });
      if (!linksOnly) {
        await parentService.updateChildren(parentId, selected);
      }
      toast.success('Parent updated');
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
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b p-6 dark:border-gray-800">
          <h3 className="text-lg font-semibold">{linksOnly ? 'Link students' : 'Edit Parent'}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        {loadingData ? (
          <LoadingSpinner className="min-h-[200px]" />
        ) : linksOnly ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Select student(s) this parent can view in their portal.
              </p>
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                {students.map((s) => (
                  <li key={s._id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={selected.includes(s._id.toString())}
                        onChange={() => toggleStudent(s._id)}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{s.user?.name}</span> — {s.rollNo}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 border-t p-6 dark:border-gray-800">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={saveLinks} disabled={savingLinks} className="btn-primary flex-1">
                {savingLinks ? 'Saving…' : 'Save links'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section className="space-y-4">
                <SectionTitle>Account</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Full name</label>
                    <input className="input-field" {...register('name', { required: true })} />
                    {errors.name && <p className="mt-1 text-sm text-red-500">Required</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Phone</label>
                    <input className="input-field" {...register('phone')} />
                  </div>
                </div>
                <AccountCredentialsFields register={register} errors={errors} />
              </section>

              <section className="space-y-4">
                <SectionTitle>Personal</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Relation</label>
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
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Alternate phone</label>
                    <input className="input-field" {...register('alternatePhone')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Blood group</label>
                    <select className="input-field" {...register('bloodGroup')}>
                      <option value="">—</option>
                      {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Spouse name</label>
                    <input className="input-field" {...register('spouseName')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Address</label>
                    <textarea className="input-field min-h-[72px]" {...register('address')} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <SectionTitle>Work</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Occupation</label>
                    <input className="input-field" {...register('occupation')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Workplace</label>
                    <input className="input-field" {...register('workplace')} />
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
                <SectionTitle>Linked students</SectionTitle>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
                  {students.map((s) => (
                    <li key={s._id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={selected.includes(s._id.toString())}
                          onChange={() => toggleStudent(s._id)}
                        />
                        {s.user?.name} — {s.rollNo}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="flex gap-3 border-t p-6 dark:border-gray-800">
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
