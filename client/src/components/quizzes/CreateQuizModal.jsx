import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { quizService } from '../../services/quizService';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  marks: 1,
});

export default function CreateQuizModal({ open, onClose, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      negativeMarking: false,
      shuffleQuestions: true,
      status: 'draft',
      timerMinutes: 30,
    },
  });
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const selectedClass = watch('class');
  const negativeMarking = watch('negativeMarking');

  useEffect(() => {
    if (!open) return;
    reset({
      negativeMarking: false,
      shuffleQuestions: true,
      status: 'draft',
      timerMinutes: 30,
    });
    setQuestions([emptyQuestion()]);
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

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIndex].options];
      opts[optIndex] = value;
      next[qIndex] = { ...next[qIndex], options: opts };
      return next;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (formData) => {
    const cleaned = questions.map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()).filter(Boolean),
      correctAnswer: Number(q.correctAnswer),
      marks: Number(q.marks) || 1,
    }));

    for (let i = 0; i < cleaned.length; i++) {
      if (!cleaned[i].question) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (cleaned[i].options.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`);
        return;
      }
    }

    setLoading(true);
    try {
      await quizService.create({
        title: formData.title,
        description: formData.description || '',
        class: formData.class,
        subject: formData.subject || undefined,
        teacher: isAdmin ? formData.teacher : undefined,
        timer: Number(formData.timerMinutes) * 60,
        status: formData.status,
        negativeMarking: !!formData.negativeMarking,
        negativeMarks: formData.negativeMarking ? Number(formData.negativeMarks) || 0.25 : 0,
        shuffleQuestions: !!formData.shuffleQuestions,
        questions: cleaned,
      });
      toast.success('Quiz created');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Quiz</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {isAdmin && (
              <div>
                <label className="mb-1 block text-sm font-medium">Teacher</label>
                <select className="input-field" {...register('teacher', { required: isAdmin })}>
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.user?.name} ({t.employeeId})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Quiz title</label>
              <input className="input-field" {...register('title', { required: true })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea className="input-field min-h-[60px]" {...register('description')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Class</label>
                <select className="input-field" {...register('class', { required: true })}>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} {c.section}</option>
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
              <div>
                <label className="mb-1 block text-sm font-medium">Time limit (minutes)</label>
                <input type="number" min="1" className="input-field" {...register('timerMinutes', { required: true, min: 1 })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select className="input-field" {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('shuffleQuestions')} />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('negativeMarking')} />
                Negative marking
              </label>
              {negativeMarking && (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Deduct</label>
                  <input type="number" step="0.25" min="0" className="input-field w-20" defaultValue={0.25} {...register('negativeMarks')} />
                  <span className="text-sm text-gray-500">per wrong answer</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Questions ({questions.length})</h4>
                <button type="button" onClick={addQuestion} className="btn-secondary text-sm py-1.5">
                  <FiPlus className="mr-1 inline" /> Add question
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-500">Q{qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700">
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                  <input
                    className="input-field mb-3"
                    placeholder="Question text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  />
                  <div className="mb-3 space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                        />
                        <input
                          className="input-field flex-1"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-xs text-gray-500">Marks</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={q.marks}
                      onChange={(e) => updateQuestion(qIndex, 'marks', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
