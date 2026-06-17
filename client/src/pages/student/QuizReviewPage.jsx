import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiMinusCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { quizService } from '../../services/quizService';

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const optionClass = (optIdx, q) => {
  const isSelected = q.selected === optIdx;
  const isCorrect = q.correctAnswer === optIdx;

  if (isCorrect) {
    return 'border-green-500 bg-green-50 dark:bg-green-900/20';
  }
  if (isSelected && !isCorrect) {
    return 'border-red-500 bg-red-50 dark:bg-red-900/20';
  }
  return 'border-gray-200 dark:border-gray-600';
};

export default function QuizReviewPage() {
  const { quizId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizService
      .getReview(quizId)
      .then(({ data }) => setReview(data.data))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Could not load review');
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) {
    return <LoadingSpinner className="min-h-[400px]" />;
  }

  if (!review) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-gray-600 dark:text-gray-400">Review not available.</p>
        <Link to="/student/quizzes" className="btn-primary mt-4 inline-block">
          Back to quizzes
        </Link>
      </div>
    );
  }

  const correctCount = review.questions.filter((q) => q.isCorrect).length;
  const skippedCount = review.questions.filter((q) => q.selected === -1).length;

  return (
    <div className="space-y-6 pb-8">
      <Link
        to="/student/quizzes"
        className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400"
      >
        <FiArrowLeft className="mr-1" /> Back to quizzes
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-semibold">{review.title}</h1>
        {review.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{review.description}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
            <span className="text-gray-600 dark:text-gray-400">Score</span>
            <p className="text-xl font-bold text-primary-600">
              {review.score} / {review.totalMarks} ({review.percentage}%)
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Correct</span>
            <p className="font-semibold">{correctCount} / {review.questions.length}</p>
          </div>
          {skippedCount > 0 && (
            <div className="rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
              <span className="text-gray-600 dark:text-gray-400">Skipped</span>
              <p className="font-semibold">{skippedCount}</p>
            </div>
          )}
          <div className="rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Time taken</span>
            <p className="font-semibold">{formatTime(review.timeTaken)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {review.questions.map((q, idx) => (
          <div
            key={q._id}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-base font-medium">
                {idx + 1}. {q.question}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({q.marks} mark{q.marks !== 1 ? 's' : ''})
                </span>
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  q.isCorrect
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : q.selected === -1
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {q.isCorrect ? (
                  <><FiCheckCircle /> Correct</>
                ) : q.selected === -1 ? (
                  <><FiMinusCircle /> Skipped</>
                ) : (
                  <><FiXCircle /> Incorrect</>
                )}
              </span>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isSelected = q.selected === optIdx;
                const isCorrect = q.correctAnswer === optIdx;
                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${optionClass(optIdx, q)}`}
                  >
                    <span className="flex-1">{opt}</span>
                    {isCorrect && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Correct answer
                      </span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        Your answer
                      </span>
                    )}
                    {isSelected && isCorrect && (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Your answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {q.selected === -1 && (
              <p className="mt-3 text-sm text-gray-500">You did not answer this question.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
