import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { FiPlus, FiTrash2, FiEye, FiPlay } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateQuizModal from '../../components/quizzes/CreateQuizModal';
import ViewQuizModal from '../../components/quizzes/ViewQuizModal';
import { quizService } from '../../services/quizService';

const statusBadge = (status) => {
  const styles = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

export default function QuizzesPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'admin' || user?.role === 'teacher';
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fetch = quizService.getAll();
    fetch
      .then(({ data }) => setQuizzes(data.data.quizzes))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await quizService.delete(id);
      toast.success('Quiz deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = isStudent
    ? [
        { key: 'title', label: 'Title' },
        { key: 'subject', label: 'Subject', render: (r) => r.subject?.name || '—' },
        { key: 'timer', label: 'Time (min)', render: (r) => Math.round((r.timer || 0) / 60) },
        { key: 'marks', label: 'Marks' },
        {
          key: 'score',
          label: 'Your score',
          render: (r) =>
            r.myAttempt
              ? `${r.myAttempt.score}/${r.myAttempt.totalMarks} (${r.myAttempt.percentage}%)`
              : 'Not taken',
        },
      ]
    : [
        { key: 'title', label: 'Title' },
        { key: 'class', label: 'Class', render: (r) => r.class ? `${r.class.name} ${r.class.section || ''}`.trim() : '—' },
        { key: 'timer', label: 'Time (min)', render: (r) => Math.round((r.timer || 0) / 60) },
        { key: 'marks', label: 'Marks' },
        { key: 'questions', label: 'Questions', render: (r) => r.questions?.length || 0 },
        { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
        { key: 'attempts', label: 'Attempts', render: (r) => r.attemptCount ?? r.attempts?.length ?? 0 },
      ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  const openView = (row) => {
    setViewId(row._id);
    setViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Quizzes</h2>
        {canManage && (
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
            <FiPlus className="mr-2 inline" /> Create Quiz
          </button>
        )}
      </div>

      {canManage && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set status to <strong>Published</strong> so students in that class can take the quiz.
        </p>
      )}

      <DataTable
        columns={columns}
        data={quizzes}
        loading={false}
        emptyTitle="No quizzes available"
        onRowClick={
          canManage
            ? openView
            : isStudent
              ? (row) => navigate(`/student/quizzes/${row._id}`)
              : undefined
        }
        actions={(row) => (
          <div className="flex justify-end gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openView(row); }}
                  className="btn-secondary py-1.5 text-xs"
                >
                  <FiEye className="mr-1 inline" /> View
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                >
                  <FiTrash2 />
                </button>
              </>
            )}
            {isStudent && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/quizzes/${row._id}`);
                }}
                className="btn-primary py-1.5 text-xs"
              >
                <FiPlay className="mr-1 inline" />
                {row.hasAttempted ? 'Retake' : 'Take quiz'}
              </button>
            )}
          </div>
        )}
      />

      <CreateQuizModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
      />

      <ViewQuizModal
        open={viewOpen}
        quizId={viewId}
        onClose={() => { setViewOpen(false); setViewId(null); }}
      />
    </div>
  );
}
