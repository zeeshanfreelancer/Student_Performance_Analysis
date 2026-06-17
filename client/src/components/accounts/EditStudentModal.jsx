import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { parentService } from '../../services/parentService';
import LoadingSpinner from '../ui/LoadingSpinner';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

function SectionTitle({ children }) {
  return (
    <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </h4>
  );
}

export default function EditStudentModal({ open, studentId, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoadingData(true);
    classService.getAll().then(({ data }) => setClasses(data.data.classes || [])).catch(() => {});
    if (isAdmin) {
      parentService.getAll().then(({ data }) => setParents(data.data.parents || [])).catch(() => {});
    }
    studentService
      .getById(studentId)
      .then(({ data }) => {
        const s = data.data.student;
        setEmail(s.user?.email || '');
        reset({
          name: s.user?.name || '',
          phone: s.user?.phone || '',
          gender: s.user?.gender || '',
          rollNo: s.rollNo || '',
          class: s.class?._id || s.class || '',
          semester: s.semester ?? 1,
          fatherName: s.fatherName || '',
          motherName: s.motherName || '',
          parentId: s.parentId?._id || s.parentId || '',
          dob: toDateInput(s.dob),
          address: s.address || '',
          bloodGroup: s.bloodGroup || '',
          emergencyName: s.emergencyContact?.name || '',
          emergencyPhone: s.emergencyContact?.phone || '',
          emergencyRelation: s.emergencyContact?.relation || '',
          previousSchool: s.previousEducation?.schoolName || '',
          previousClass: s.previousEducation?.classOrGrade || '',
          previousBoard: s.previousEducation?.board || '',
          previousYear: s.previousEducation?.passingYear || '',
          previousPercentage: s.previousEducation?.percentage || '',
          status: s.status === 'graduated' ? 'completed' : (s.status || 'active'),
        });
      })
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoadingData(false));
  }, [open, studentId, reset, isAdmin]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        rollNo: formData.rollNo?.toUpperCase(),
        class: formData.class,
        semester: formData.semester ? Number(formData.semester) : 1,
        fatherName: formData.fatherName || '',
        motherName: formData.motherName || '',
        dob: formData.dob || undefined,
        address: formData.address || '',
        bloodGroup: formData.bloodGroup || '',
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
      };

      if (!isTeacher) {
        Object.assign(payload, {
          name: formData.name,
          phone: formData.phone || '',
          gender: formData.gender || '',
          parentId: formData.parentId || null,
        });
      }

      await studentService.update(studentId, payload);

      if (isAdmin && formData.status) {
        await studentService.updateStatus(studentId, formData.status);
      }

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
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Student</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        {loadingData ? (
          <LoadingSpinner className="min-h-[200px]" />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isTeacher && (
              <section className="space-y-4">
                <SectionTitle>Account</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Full name</label>
                    <input className="input-field" {...register('name', { required: true })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <input className="input-field bg-gray-50 dark:bg-gray-800" value={email} readOnly disabled />
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
                </div>
              </section>
            )}

            <section className="space-y-4">
              <SectionTitle>Academic</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Roll no</label>
                  <input className="input-field" {...register('rollNo', { required: true })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Semester</label>
                  <input type="number" min={1} max={12} className="input-field" {...register('semester')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Class</label>
                  <select className="input-field" {...register('class', { required: true })}>
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.section} ({c.academicYear})
                      </option>
                    ))}
                  </select>
                  {errors.class && <p className="mt-1 text-sm text-red-500">Class is required</p>}
                </div>
                {isAdmin && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <select className="input-field" {...register('status')}>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Personal</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {isTeacher && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium">Student name</label>
                      <input className="input-field bg-gray-50 dark:bg-gray-800" {...register('name')} readOnly disabled />
                      <p className="mt-1 text-xs text-gray-500">Name can only be changed by admin.</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">Date of birth</label>
                  <input type="date" className="input-field" {...register('dob')} />
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
                  <label className="mb-1 block text-sm font-medium">Emergency phone</label>
                  <input className="input-field" {...register('emergencyPhone')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Relation</label>
                  <input className="input-field" {...register('emergencyRelation')} />
                </div>
                {isAdmin && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Linked parent</label>
                    <select className="input-field" {...register('parentId')}>
                      <option value="">No parent</option>
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
                  <label className="mb-1 block text-sm font-medium">School / institute</label>
                  <input className="input-field" {...register('previousSchool')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Last class / grade</label>
                  <input className="input-field" {...register('previousClass')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Board</label>
                  <input className="input-field" {...register('previousBoard')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Passing year</label>
                  <input className="input-field" {...register('previousYear')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Marks / percentage</label>
                  <input className="input-field" {...register('previousPercentage')} />
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
