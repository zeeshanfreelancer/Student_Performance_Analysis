import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUsers } from 'react-icons/fi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DataTable from '../../components/ui/DataTable';
import { parentService } from '../../services/parentService';

export default function ParentChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    parentService
      .getDashboard()
      .then(({ data: res }) => setChildren(res.data?.children || []))
      .catch(() => toast.error('Failed to load children'))
      .finally(() => setLoading(false));
  }, []);

  const tableRows = children.map((c) => ({
    _id: c.student._id,
    name: c.student.user?.name,
    rollNo: c.student.rollNo,
    className: c.student.class
      ? `${c.student.class.name} ${c.student.class.section || ''}`.trim()
      : '—',
    email: c.student.user?.email || '—',
    gpa: c.student.gpa?.toFixed(2) ?? '—',
    attendance: `${c.student.attendancePercentage ?? 0}%`,
    assignments: c.assignments ?? 0,
    alerts: c.alerts?.length ?? 0,
    studentId: c.student._id,
  }));

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'rollNo', label: 'Roll No' },
    { key: 'className', label: 'Class' },
    { key: 'email', label: 'Email' },
    {
      key: 'gpa',
      label: 'GPA',
      render: (r) => <span className="font-medium">{r.gpa}</span>,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (r) => (
        <span
          className={
            parseFloat(r.attendance) < 75
              ? 'font-medium text-red-600 dark:text-red-400'
              : 'font-medium text-green-600 dark:text-green-400'
          }
        >
          {r.attendance}
        </span>
      ),
    },
    { key: 'assignments', label: 'Assignments' },
    {
      key: 'alerts',
      label: 'Alerts',
      render: (r) =>
        r.alerts > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {r.alerts}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  if (loading) return <LoadingSpinner className="min-h-[400px]" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <FiUsers /> My Children
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Students linked to your parent account. Click a row to view grades.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tableRows}
        loading={false}
        emptyTitle="No children linked"
        emptyDescription="Contact the school admin to link your child to this account."
        onRowClick={(row) => navigate(`/parent/grades?child=${row.studentId}`)}
      />

      {tableRows.length > 0 && (
        <p className="text-xs text-gray-500">
          {tableRows.length} linked student{tableRows.length !== 1 ? 's' : ''} shown.
        </p>
      )}
    </div>
  );
}
