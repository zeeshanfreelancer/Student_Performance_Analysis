import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiDownload, FiFileText, FiClock, FiUsers } from 'react-icons/fi';
import { assignmentService } from '../../services/assignmentService';
import { formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

const statusBadge = (status) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    submitted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    late: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    graded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default function ViewAssignmentModal({ open, assignmentId, onClose }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !assignmentId) {
      setAssignment(null);
      return;
    }
    setLoading(true);
    assignmentService
      .getById(assignmentId)
      .then(({ data }) => setAssignment(data.data.assignment))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load assignment');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, assignmentId, onClose]);

  if (!open) return null;

  const submissions = assignment?.submissions || [];
  const submittedCount = submissions.filter((s) => s.status !== 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Details</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <LoadingSpinner className="min-h-[200px]" />
          ) : assignment ? (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{assignment.title}</h4>
                  {statusBadge(assignment.status)}
                </div>
                {assignment.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{assignment.description}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium">
                    {assignment.class
                      ? `${assignment.class.name} ${assignment.class.section || ''} (${assignment.class.academicYear || ''})`.trim()
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="font-medium">{assignment.subject?.name || '—'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500">Max marks</p>
                  <p className="font-medium">{assignment.maxMarks}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FiClock className="h-3 w-3" /> Deadline</p>
                  <p className="font-medium">{formatDateTime(assignment.deadline)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500">Teacher</p>
                  <p className="font-medium">{assignment.teacher?.user?.name || '—'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FiUsers className="h-3 w-3" /> Submissions</p>
                  <p className="font-medium">{submittedCount} / {submissions.length} recorded</p>
                </div>
              </div>

              {assignment.attachments?.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Assignment files</h5>
                  <ul className="space-y-2">
                    {assignment.attachments.map((file, i) => (
                      <li key={i}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                        >
                          <FiFileText /> {file.name || `File ${i + 1}`}
                          <FiDownload className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Student submissions</h5>
                {submissions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
                    No submissions yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Student</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Roll No</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Submitted</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Files</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {submissions.map((sub, i) => (
                          <tr key={sub._id || i}>
                            <td className="px-4 py-3 font-medium">{sub.student?.user?.name || '—'}</td>
                            <td className="px-4 py-3">{sub.student?.rollNo || '—'}</td>
                            <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {sub.submittedAt ? formatDateTime(sub.submittedAt) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {sub.files?.length ? (
                                <ul className="space-y-1">
                                  {sub.files.map((f, j) => (
                                    <li key={j}>
                                      <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary-600 hover:underline"
                                      >
                                        {f.name || `File ${j + 1}`}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
