import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import DataTable from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { quizService } from '../../services/quizService';

export default function QuizzesPage() {
  const { user } = useSelector((state) => state.auth);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = user?.role === 'student' ? quizService.getAll({ status: 'published' }) : quizService.getAll();
    fetch
      .then(({ data }) => setQuizzes(data.data.quizzes))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'timer', label: 'Timer (min)', render: (r) => Math.round(r.timer / 60) },
    { key: 'marks', label: 'Marks' },
    { key: 'status', label: 'Status' },
  ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Quizzes</h2>
      <DataTable
        columns={columns}
        data={quizzes}
        loading={false}
        emptyTitle="No quizzes available"
        onRowClick={user?.role === 'student' ? (q) => navigate(`/student/quizzes/${q._id}`) : undefined}
      />
    </div>
  );
}
