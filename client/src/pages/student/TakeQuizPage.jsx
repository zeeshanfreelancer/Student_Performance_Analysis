import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiClock, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { quizService } from '../../services/quizService';

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function TakeQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const startTimeRef = useRef(null);
  const submittingRef = useRef(false);
  const submitFnRef = useRef(null);

  const doSubmit = useCallback(async () => {
    if (!quiz || submittingRef.current) return;
    submittingRef.current = true;
    setPhase('submitting');

    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const answersPayload = quiz.questions.map((q) => ({
      questionId: q._id,
      selected: answers[q._id] ?? -1,
    }));

    try {
      const { data } = await quizService.submit(quizId, { answers: answersPayload, timeTaken });
      setResult(data.data);
      setPhase('result');
      toast.success('Quiz submitted!');
    } catch (err) {
      submittingRef.current = false;
      toast.error(err.response?.data?.message || 'Submit failed');
      setPhase('quiz');
    }
  }, [quiz, answers, quizId]);

  submitFnRef.current = doSubmit;

  useEffect(() => {
    quizService
      .start(quizId)
      .then(({ data }) => {
        setQuiz(data.data);
        setPhase('intro');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Could not load quiz');
        navigate('/student/quizzes');
      });
  }, [quizId, navigate]);

  useEffect(() => {
    if (phase !== 'quiz' || !quiz?.timer) return undefined;

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          submitFnRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, quiz?.timer]);

  const startAttempt = () => {
    startTimeRef.current = Date.now();
    setSecondsLeft(quiz.timer || 0);
    setPhase('quiz');
  };

  const setAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const answeredCount = quiz?.questions?.filter((q) => answers[q._id] !== undefined).length ?? 0;

  if (phase === 'loading') {
    return <LoadingSpinner className="min-h-[400px]" />;
  }

  if (phase === 'result' && result) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <FiCheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-semibold">Quiz complete</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{quiz?.title}</p>
          <div className="mt-6 text-4xl font-bold text-primary-600">
            {result.score} / {result.totalMarks}
          </div>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{result.percentage}%</p>
          <Link to="/student/quizzes" className="btn-primary mt-8 inline-block">
            Back to quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'intro' && quiz) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to="/student/quizzes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400"
        >
          <FiArrowLeft className="mr-1" /> Back to quizzes
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-semibold">{quiz.title}</h1>
          {quiz.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{quiz.description}</p>
          )}

          <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <FiClock /> Time limit: {formatTime(quiz.timer || 0)}
            </li>
            <li>Questions: {quiz.totalQuestions}</li>
            <li>Total marks: {quiz.marks}</li>
          </ul>

          {quiz.hasAttempted && quiz.previousAttempt && (
            <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              Previous attempt: {quiz.previousAttempt.score}/{quiz.previousAttempt.totalMarks}{' '}
              ({quiz.previousAttempt.percentage}%). Starting again will replace that score.
            </div>
          )}

          <button type="button" onClick={startAttempt} className="btn-primary mt-8 w-full sm:w-auto">
            {quiz.hasAttempted ? 'Retake quiz' : 'Start quiz'}
          </button>
        </div>
      </div>
    );
  }

  if ((phase === 'quiz' || phase === 'submitting') && quiz) {
    const timerLow = secondsLeft <= 60;

    return (
      <div className="space-y-6 pb-24">
        <div className="sticky top-0 z-10 -mx-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:mx-0 sm:rounded-xl sm:border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-semibold">{quiz.title}</h1>
              <p className="text-sm text-gray-500">
                {answeredCount} of {quiz.questions.length} answered
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-semibold ${
                timerLow ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <FiClock />
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {quiz.questions.map((q, idx) => (
            <fieldset
              key={q._id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <legend className="mb-4 text-base font-medium">
                {idx + 1}. {q.question}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({q.marks} mark{q.marks !== 1 ? 's' : ''})
                </span>
              </legend>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const selected = answers[q._id] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        checked={selected}
                        onChange={() => setAnswer(q._id, optIdx)}
                        disabled={phase === 'submitting'}
                        className="text-primary-600"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 lg:left-64">
          <div className="mx-auto flex max-w-4xl justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/quizzes')}
              className="btn-secondary"
              disabled={phase === 'submitting'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={phase === 'submitting'}
              className="btn-primary"
            >
              {phase === 'submitting' ? 'Submitting…' : 'Submit quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
