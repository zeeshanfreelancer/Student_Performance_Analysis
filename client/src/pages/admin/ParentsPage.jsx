import { useEffect, useState } from 'react';
import { FiPlus, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import CreateAccountModal from '../../components/accounts/CreateAccountModal';
import EditParentModal from '../../components/accounts/EditParentModal';
import { parentService } from '../../services/parentService';

export default function ParentsPage() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editParent, setEditParent] = useState(null);

  const load = () => {
    setLoading(true);
    parentService
      .getAll()
      .then(({ data }) => setParents(data.data.parents || []))
      .catch(() => toast.error('Failed to load parents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'name', label: 'Parent', render: (r) => r.user?.name },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    { key: 'phone', label: 'Phone', render: (r) => r.user?.phone || '—' },
    { key: 'relation', label: 'Relation', render: (r) => r.relation || 'guardian' },
    {
      key: 'children',
      label: 'Linked students',
      render: (r) => {
        if (!r.children?.length) {
          return <span className="text-amber-600 text-sm">No students linked</span>;
        }
        return (
          <ul className="text-sm">
            {r.children.map((c) => (
              <li key={c._id}>
                {c.user?.name} ({c.rollNo})
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          type="button"
          onClick={() => setEditParent(r)}
          className="text-sm text-primary-600 hover:underline dark:text-primary-400"
        >
          Link students
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiUsers /> Parents
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create parent accounts and link them to their children so they can view grades and attendance.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <FiPlus className="mr-2 inline" /> Add Parent
        </button>
      </div>

      <DataTable columns={columns} data={parents} loading={loading} emptyTitle="No parents yet" />

      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={load}
        defaultRole="parent"
      />

      <EditParentModal
        open={!!editParent}
        parent={editParent}
        onClose={() => setEditParent(null)}
        onSuccess={load}
      />
    </div>
  );
}
