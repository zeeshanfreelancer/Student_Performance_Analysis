import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { parentService } from '../../services/parentService';
import { studentService } from '../../services/studentService';

export default function EditParentModal({ open, parent, onClose, onSuccess }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !parent) return;
    const linked = (parent.children || []).map((c) => (c._id || c).toString());
    setSelected(linked);
    setLoading(true);
    studentService
      .getAll({ limit: 500 })
      .then(({ data }) => setStudents(data.data.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [open, parent]);

  if (!open || !parent) return null;

  const toggleStudent = (id) => {
    const sid = id.toString();
    setSelected((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await parentService.updateChildren(parent._id, selected);
      toast.success(data.message || 'Students linked to parent');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update links');
    } finally {
      setSaving(false);
    }
  };

  const parentName = parent.user?.name || 'Parent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Link students</h3>
            <p className="mt-1 text-sm text-gray-500">{parentName} — {parent.user?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Select the student(s) this parent should see in their portal (grades, attendance, messages).
          </p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading students…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">No students found. Create students first.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {students.map((s) => {
                const id = s._id.toString();
                const checked = selected.includes(id);
                const otherParent =
                  s.parentId &&
                  s.parentId._id?.toString() !== parent._id &&
                  s.parentId.toString?.() !== parent._id &&
                  s.parentId.user?.name;
                return (
                  <li key={s._id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(id)}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{s.user?.name}</span>
                        <span className="text-gray-500"> — {s.rollNo}</span>
                        {s.class && (
                          <span className="text-gray-400">
                            {' '}
                            ({s.class.name} {s.class.section})
                          </span>
                        )}
                        {otherParent && !checked && (
                          <span className="mt-0.5 block text-xs text-amber-600">
                            Currently linked to {s.parentId.user?.name || 'another parent'}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-xs text-gray-500">{selected.length} student(s) selected</p>
        </div>

        <div className="flex gap-3 border-t border-gray-200 p-6 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save links'}
          </button>
        </div>
      </div>
    </div>
  );
}
