import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { quizService } from '../../services/quizService';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ViewQuizModal({ open, quizId, onClose }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !quizId) {
      setQuiz(null);
      return;
    }
    setLoading(true);
    quizService
      .getById(quizId)
      .then(({ data }) => setQuiz(data.data.quiz))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load quiz');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, quizId, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Quiz Details</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <LoadingSpinner className="min-h-[200px]" />
          ) : quiz ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold">{quiz.title}</h4>
                {quiz.description && <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>}
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-gray-500">Class:</span> {quiz.class?.name} {quiz.class?.section}</p>
                <p><span className="text-gray-500">Subject:</span> {quiz.subject?.name || '—'}</p>
                <p><span className="text-gray-500">Time:</span> {Math.round((quiz.timer || 0) / 60)} min</p>
                <p><span className="text-gray-500">Marks:</span> {quiz.marks}</p>
                <p><span className="text-gray-500">Status:</span> {quiz.status}</p>
                <p><span className="text-gray-500">Attempts:</span> {quiz.attempts?.length || 0}</p>
              </div>
              <div>
                <h5 className="mb-2 font-medium">Questions ({quiz.questions?.length})</h5>
                <ol className="space-y-3">
                  {quiz.questions?.map((q, i) => (
                    <li key={q._id || i} className="rounded-lg border p-3 dark:border-gray-700">
                      <p className="font-medium">{i + 1}. {q.question}</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {q.options?.map((opt, j) => (
                          <li key={j} className={j === q.correctAnswer ? 'font-medium text-green-600' : ''}>
                            {j === q.correctAnswer ? '✓ ' : '○ '}{opt}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-gray-500">{q.marks} mark(s)</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </div>
        <div className="border-t px-6 py-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
