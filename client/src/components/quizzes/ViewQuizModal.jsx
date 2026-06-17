import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { quizService } from '../../services/quizService';
import LoadingSpinner from '../ui/LoadingSpinner';

const formatTime = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

export default function ViewQuizModal({ open, quizId, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const showResults = user?.role === 'teacher' || user?.role === 'admin';
  const [quiz, setQuiz] = useState(null);
  const [classStudentCount, setClassStudentCount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !quizId) {
      setQuiz(null);
      setClassStudentCount(null);
      return;
    }
    setLoading(true);
    quizService
      .getById(quizId)
      .then(({ data }) => {
        setQuiz(data.data.quiz);
        setClassStudentCount(data.data.classStudentCount ?? null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load quiz');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, quizId, onClose]);

  const attempts = useMemo(() => {
    if (!quiz?.attempts?.length) return [];
    return [...quiz.attempts].sort((a, b) => b.score - a.score || b.percentage - a.percentage);
  }, [quiz]);

  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const avgPercentage = Math.round(
      attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
    );
    return {
      averageScore: (totalScore / attempts.length).toFixed(1),
      avgPercentage,
      highestScore: attempts[0]?.score ?? 0,
    };
  }, [attempts]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
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
            <div className="space-y-6">
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
                <p>
                  <span className="text-gray-500">Attempts:</span>{' '}
                  {attempts.length}
                  {classStudentCount != null && ` of ${classStudentCount} students`}
                </p>
              </div>

              {showResults && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h5 className="font-medium">Student results</h5>
                    {stats && (
                      <p className="mt-1 text-sm text-gray-500">
                        Avg score: {stats.averageScore}/{attempts[0]?.totalMarks ?? quiz.marks} ({stats.avgPercentage}%)
                        {' · '}
                        Highest: {stats.highestScore}/{attempts[0]?.totalMarks ?? quiz.marks}
                      </p>
                    )}
                  </div>
                  {attempts.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">#</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Student</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Roll no.</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Score</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">%</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Completed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {attempts.map((attempt, i) => (
                            <tr key={attempt._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                              <td className="px-4 py-2 font-medium">
                                {attempt.student?.user?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-2">{attempt.student?.rollNo || '—'}</td>
                              <td className="px-4 py-2">
                                {attempt.score}/{attempt.totalMarks}
                              </td>
                              <td className="px-4 py-2">{attempt.percentage}%</td>
                              <td className="px-4 py-2">{formatTime(attempt.timeTaken)}</td>
                              <td className="px-4 py-2 text-gray-500">{formatDate(attempt.completedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">
                      No students have attempted this quiz yet.
                    </p>
                  )}
                </div>
              )}

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
