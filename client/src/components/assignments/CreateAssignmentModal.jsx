import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX, FiPaperclip } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { assignmentService } from '../../services/assignmentService';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';

export default function CreateAssignmentModal({ open, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedClass = watch('class');

  useEffect(() => {
    if (!open) return;
    reset();
    setFiles([]);
    classService.getAll().then(({ data }) => setClasses(data.data.classes)).catch(() => {});
    if (isAdmin) {
      teacherService.getAll().then(({ data }) => setTeachers(data.data.teachers)).catch(() => {});
    }
  }, [open, isAdmin, reset]);

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    subjectService.getAll({ class: selectedClass }).then(({ data }) => setSubjects(data.data.subjects)).catch(() => setSubjects([]));
  }, [selectedClass]);

  if (!open) return null;

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description || '');
      form.append('deadline', formData.deadline);
      form.append('class', formData.class);
      if (formData.subject) form.append('subject', formData.subject);
      if (formData.maxMarks) form.append('maxMarks', formData.maxMarks);
      if (isAdmin && formData.teacher) form.append('teacher', formData.teacher);
      files.forEach((f) => form.append('attachments', f));

      await assignmentService.create(form);
      toast.success('Assignment created');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Assignment</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium">Teacher</label>
              <select className="input-field" {...register('teacher', { required: isAdmin })}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.user?.name} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="input-field" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="input-field min-h-[80px]" {...register('description')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="mb-1 block text-sm font-medium">Subject (optional)</label>
              <select className="input-field" {...register('subject')}>
                <option value="">—</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Deadline</label>
              <input type="datetime-local" className="input-field" {...register('deadline', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Max marks</label>
              <input type="number" min="1" className="input-field" defaultValue={100} {...register('maxMarks')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Attachments (optional)</label>
            <input
              type="file"
              multiple
              className="input-field"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <FiPaperclip className="h-4 w-4" /> {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
