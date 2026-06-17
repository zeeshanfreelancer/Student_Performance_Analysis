import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { parentService } from '../../services/parentService';
import { ROLE_LABELS } from '../../utils/constants';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </h4>
  );
}

export default function CreateStudentModal({ open, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    classService
      .getAll()
      .then(({ data }) => setClasses(data.data.classes))
      .catch(() => toast.error('Failed to load classes'));
    if (user?.role === 'admin') {
      parentService
        .getAll()
        .then(({ data }) => setParents(data.data.parents || []))
        .catch(() => {});
    }
    reset();
  }, [open, reset, user?.role]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await studentService.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rollNo: formData.rollNo.toUpperCase(),
        class: formData.class,
        semester: formData.semester ? Number(formData.semester) : 1,
        phone: formData.phone?.trim() || '',
        gender: formData.gender || '',
        dob: formData.dob || undefined,
        address: formData.address?.trim() || '',
        bloodGroup: formData.bloodGroup || '',
        fatherName: formData.fatherName?.trim() || '',
        motherName: formData.motherName?.trim() || '',
        parentId: formData.parentId || undefined,
        emergencyContact: {
          name: formData.emergencyName?.trim() || '',
          phone: formData.emergencyPhone?.trim() || '',
          relation: formData.emergencyRelation?.trim() || '',
        },
        previousEducation: {
          schoolName: formData.previousSchool?.trim() || '',
          classOrGrade: formData.previousClass?.trim() || '',
          board: formData.previousBoard?.trim() || '',
          passingYear: formData.previousYear?.trim() || '',
          percentage: formData.previousPercentage?.trim() || '',
        },
      });
      const loginHint = data.data?.login?.email
        ? ` Login: ${data.data.login.email} (${ROLE_LABELS.student})`
        : '';
      toast.success((data.message || 'Student account created') + loginHint);
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Student Account</h3>
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
            <SectionTitle>Academic details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Roll no</label>
                <input className="input-field" {...register('rollNo', { required: 'Roll number is required' })} />
                {errors.rollNo && <p className="mt-1 text-sm text-red-500">{errors.rollNo.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Semester</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={1}
                  className="input-field"
                  {...register('semester')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Class / program</label>
                {isTeacher && classes.length === 0 ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    No class assigned to you. Contact admin to assign a class first.
                  </p>
                ) : (
                  <select className="input-field" {...register('class', { required: 'Class is required' })}>
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
                <input className="input-field" placeholder="Student or guardian phone" {...register('phone')} />
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
            <SectionTitle>Family & guardian</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Father&apos;s name</label>
                <input className="input-field" {...register('fatherName')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mother&apos;s name</label>
                <input className="input-field" {...register('motherName')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Emergency contact name</label>
                <input className="input-field" {...register('emergencyName')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Emergency contact phone</label>
                <input className="input-field" {...register('emergencyPhone')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Relation to student</label>
                <input className="input-field" placeholder="e.g. Uncle, Guardian" {...register('emergencyRelation')} />
              </div>
              {user?.role === 'admin' && parents.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Link to parent account (optional)</label>
                  <select className="input-field" {...register('parentId')}>
                    <option value="">No parent linked</option>
                    {parents.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.user?.name} ({p.user?.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Previous education</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Previous school / institute</label>
                <input className="input-field" {...register('previousSchool')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Last class / grade</label>
                <input className="input-field" placeholder="e.g. 10th, FSc" {...register('previousClass')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Board / university</label>
                <input className="input-field" placeholder="e.g. FBISE, BISE" {...register('previousBoard')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Passing year</label>
                <input className="input-field" placeholder="e.g. 2024" {...register('previousYear')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Marks / percentage</label>
                <input className="input-field" placeholder="e.g. 85% or 750/1100" {...register('previousPercentage')} />
              </div>
            </div>
          </section>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={loading || (isTeacher && classes.length === 0)}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
