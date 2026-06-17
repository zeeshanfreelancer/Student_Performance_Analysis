import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiDownload, FiFileText } from 'react-icons/fi';
import { useSelector } from 'react-redux';
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
  const { user } = useSelector((state) => state.auth);
  const showResults = user?.role === 'teacher' || user?.role === 'admin';
  const [assignment, setAssignment] = useState(null);
  const [classStudentCount, setClassStudentCount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !assignmentId) {
      setAssignment(null);
      setClassStudentCount(null);
      return;
    }
    setLoading(true);
    assignmentService
      .getById(assignmentId)
      .then(({ data }) => {
        setAssignment(data.data.assignment);
        setClassStudentCount(data.data.classStudentCount ?? null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load assignment');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, assignmentId, onClose]);

  const submissions = useMemo(() => {
    if (!assignment?.submissions?.length) return [];
    return [...assignment.submissions].sort((a, b) => {
      const gradeA = a.grade ?? -1;
      const gradeB = b.grade ?? -1;
      if (gradeB !== gradeA) return gradeB - gradeA;
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }, [assignment]);

  const stats = useMemo(() => {
    if (!submissions.length) return null;
    const graded = submissions.filter((s) => s.grade != null);
    const lateCount = submissions.filter((s) => s.status === 'late').length;
    const avgGrade = graded.length
      ? (graded.reduce((sum, s) => sum + s.grade, 0) / graded.length).toFixed(1)
      : null;
    const highestGrade = graded.length
      ? Math.max(...graded.map((s) => s.grade))
      : null;

    return { gradedCount: graded.length, lateCount, avgGrade, highestGrade };
  }, [submissions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
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

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-gray-500">Class:</span>{' '}
                  {assignment.class
                    ? `${assignment.class.name} ${assignment.class.section || ''}`.trim()
                    : '—'}
                </p>
                <p><span className="text-gray-500">Subject:</span> {assignment.subject?.name || '—'}</p>
                <p><span className="text-gray-500">Max marks:</span> {assignment.maxMarks}</p>
                <p><span className="text-gray-500">Deadline:</span> {formatDateTime(assignment.deadline)}</p>
                <p><span className="text-gray-500">Teacher:</span> {assignment.teacher?.user?.name || '—'}</p>
                <p>
                  <span className="text-gray-500">Submissions:</span>{' '}
                  {submissions.length}
                  {classStudentCount != null && ` of ${classStudentCount} students`}
                </p>
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

              {showResults && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h5 className="font-medium">Student submissions</h5>
                    {stats && submissions.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        {[
                          stats.gradedCount > 0 && `Avg grade: ${stats.avgGrade}/${assignment.maxMarks}`,
                          stats.gradedCount > 0 && `Highest: ${stats.highestGrade}/${assignment.maxMarks}`,
                          stats.lateCount > 0 && `${stats.lateCount} late`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {submissions.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">#</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Student</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Roll no.</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Grade</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Submitted</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Files</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {submissions.map((sub, i) => (
                            <tr key={sub._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                              <td className="px-4 py-2 font-medium">{sub.student?.user?.name || '—'}</td>
                              <td className="px-4 py-2">{sub.student?.rollNo || '—'}</td>
                              <td className="px-4 py-2">{statusBadge(sub.status)}</td>
                              <td className="px-4 py-2">
                                {sub.grade != null ? `${sub.grade}/${assignment.maxMarks}` : '—'}
                              </td>
                              <td className="px-4 py-2 text-gray-500">
                                {sub.submittedAt ? formatDateTime(sub.submittedAt) : '—'}
                              </td>
                              <td className="px-4 py-2">
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
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">
                      No students have submitted this assignment yet.
                    </p>
                  )}
                </div>
              )}
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
