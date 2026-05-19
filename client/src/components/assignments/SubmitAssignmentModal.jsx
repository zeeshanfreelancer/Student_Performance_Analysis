import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiPaperclip, FiUpload } from 'react-icons/fi';
import { assignmentService } from '../../services/assignmentService';
import { formatDateTime } from '../../utils/helpers';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  submitted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  late: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  graded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function SubmitAssignmentModal({ open, assignment, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!open || !assignment) return null;

  const isPastDeadline = new Date() > new Date(assignment.deadline);
  const alreadySubmitted = assignment.submissionStatus && assignment.submissionStatus !== 'pending';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      await assignmentService.submit(assignment._id, form);
      toast.success(alreadySubmitted ? 'Submission updated' : 'Assignment submitted');
      setFiles([]);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Submit Assignment</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX />
          </button>
        </div>

        <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <h4 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h4>
          {assignment.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span>Deadline: {formatDateTime(assignment.deadline)}</span>
            {assignment.subject?.name && <span>Subject: {assignment.subject.name}</span>}
            <span>Max marks: {assignment.maxMarks}</span>
          </div>
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusStyles[assignment.submissionStatus] || statusStyles.pending}`}>
            {assignment.submissionStatus || 'pending'}
          </span>
          {assignment.attachments?.length > 0 && (
            <div className="pt-2">
              <p className="mb-1 text-xs font-medium text-gray-500">Teacher attachments:</p>
              <ul className="space-y-1">
                {assignment.attachments.map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline">
                      {a.name || `Attachment ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {assignment.submission?.files?.length > 0 && (
            <div className="pt-2">
              <p className="mb-1 text-xs font-medium text-gray-500">Your previous upload:</p>
              <ul className="space-y-1">
                {assignment.submission.files.map((f, i) => (
                  <li key={i}>
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline">
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Upload files {alreadySubmitted ? '(replaces previous submission)' : ''}
            </label>
            <input
              type="file"
              multiple
              required
              className="input-field"
              accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <FiPaperclip className="h-4 w-4" /> {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isPastDeadline && !alreadySubmitted && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              The deadline has passed. Your submission will be marked as late.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <FiUpload className="mr-2 inline" />
              {loading ? 'Uploading...' : alreadySubmitted ? 'Update Submission' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
