import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import CreateAccountModal from '../../components/accounts/CreateAccountModal';
import { userService } from '../../services/userService';
import { ROLE_LABELS } from '../../utils/constants';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      userService.getAll({ limit: 50 }),
      userService.getActivityLogs({ limit: 30 }),
    ])
      .then(([usersRes, logsRes]) => {
        setUsers(usersRes.data.data.users);
        setLogs(logsRes.data.data.logs);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => ROLE_LABELS[r.role] },
    { key: 'status', label: 'Status' },
  ];

  const logColumns = [
    { key: 'user', label: 'User', render: (r) => r.user?.name },
    { key: 'action', label: 'Action' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        {tab === 'users' && (
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <FiPlus className="mr-2 inline" /> Create Account
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b dark:border-gray-800">
        <button type="button" onClick={() => setTab('users')} className={`pb-2 ${tab === 'users' ? 'border-b-2 border-primary-600 font-medium' : ''}`}>Users</button>
        <button type="button" onClick={() => setTab('logs')} className={`pb-2 ${tab === 'logs' ? 'border-b-2 border-primary-600 font-medium' : ''}`}>Activity Logs</button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Create admin, teacher, or parent accounts. Students are created from the Students page.
      </p>

      {tab === 'users' ? (
        <DataTable columns={userColumns} data={users} loading={loading} emptyTitle="No users" />
      ) : (
        <DataTable columns={logColumns} data={logs} loading={loading} emptyTitle="No activity logs" />
      )}

      <CreateAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
