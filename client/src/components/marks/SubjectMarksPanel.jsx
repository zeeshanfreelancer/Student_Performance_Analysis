import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiEdit2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import DataTable from '../ui/DataTable';
import { subjectService } from '../../services/subjectService';
import { resultService } from '../../services/resultService';
import {
  getMaxMarksFromCredits,
  PASS_MARK_THRESHOLD,
  calcSubjectPassStatus,
  passStatusLabel,
  passStatusClass,
} from '../../utils/subjectMarks';

export default function SubjectMarksPanel() {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subject') || '';

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [maxMarks, setMaxMarks] = useState(60);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [isEditing, setIsEditing] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    subjectService
      .getAll({ status: 'active' })
      .then(({ data }) => {
        const list = data.data.subjects || [];
        setSubjects(list);
        if (!subjectId && list.length === 1) setSubjectId(list[0]._id);
        if (initialSubjectId && list.some((s) => s._id === initialSubjectId)) {
          setSubjectId(initialSubjectId);
        }
      })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoadingSubjects(false));
  }, [initialSubjectId]);

  const loadRoster = useCallback(async () => {
    if (!subjectId) {
      setStudents([]);
      setMarks({});
      setIsEditing(true);
      return;
    }
    setLoadingRoster(true);
    try {
      const { data } = await resultService.getSubjectMarks(subjectId);
      const roster = data.data.students || [];
      setMaxMarks(data.data.maxMarks);
      setStudents(roster);
      const initial = {};
      roster.forEach((s) => {
        initial[s._id] = s.result?.marks ?? '';
      });
      setMarks(initial);
      const hasSaved = roster.some((s) => s.result != null);
      setIsEditing(!hasSaved);
    } catch {
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const selectedSubject = subjects.find((s) => s._id === subjectId);
  const credits = selectedSubject?.credits ?? 3;
  const displayMax = maxMarks || getMaxMarksFromCredits(credits);

  const savedResults = students
    .filter((s) => s.result != null)
    .map((s) => ({
      _id: s._id,
      rollNo: s.rollNo,
      name: s.user?.name || 'Unknown',
      marks: s.result.marks,
      maxMarks: s.result.maxMarks || displayMax,
      passStatus: s.result.passStatus || calcSubjectPassStatus(s.result.marks),
    }));

  const handleSave = async () => {
    if (!subjectId) {
      toast.error('Select a subject');
      return;
    }
    if (!students.length) {
      toast.error('No students to save');
      return;
    }

    for (const s of students) {
      const val = marks[s._id];
      if (val === '' || val === undefined) continue;
      const num = Number(val);
      if (Number.isNaN(num) || num < 0 || num > displayMax) {
        toast.error(`Marks for ${s.user?.name || 'student'} must be between 0 and ${displayMax}`);
        return;
      }
    }

    const toSave = students.filter((s) => marks[s._id] !== '' && marks[s._id] !== undefined);
    if (!toSave.length) {
      toast.error('Enter marks for at least one student');
      return;
    }

    setSaving(true);
    try {
      await resultService.saveSubjectMarks(
        subjectId,
        toSave.map((s) => ({ student: s._id, marks: Number(marks[s._id]) }))
      );
      toast.success('Marks saved');
      setIsEditing(false);
      loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const subjectOptionLabel = (s) => {
    const cls = s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : '';
    const max = getMaxMarksFromCredits(s.credits);
    return cls ? `${s.name} (${cls}) — max ${max}` : `${s.name} — max ${max}`;
  };

  const resultColumns = [
    { key: 'rollNo', label: 'Roll No' },
    { key: 'name', label: 'Student' },
    {
      key: 'marks',
      label: 'Marks',
      render: (r) => `${r.marks} / ${r.maxMarks}`,
    },
    {
      key: 'passStatus',
      label: 'Result',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${passStatusClass(r.passStatus)}`}>
          {passStatusLabel(r.passStatus)}
        </span>
      ),
    },
  ];

  if (loadingSubjects) return <LoadingSpinner className="min-h-[120px]" />;

  if (!subjects.length) {
    return (
      <div className="card rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        No subjects assigned yet. Ask an admin to add subjects and assign them to you.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Enter subject marks' : 'Marks saved'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Max marks = credits × 20. Pass if marks &gt; {PASS_MARK_THRESHOLD}, fail if {PASS_MARK_THRESHOLD} or below.
            </p>
          </div>
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingRoster || !students.length || !subjectId}
              className="btn-primary shrink-0"
            >
              <FiSave className="mr-2 inline" />
              {saving ? 'Saving…' : 'Save marks'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary shrink-0"
            >
              <FiEdit2 className="mr-2 inline" />
              Update marks
            </button>
          )}
        </div>

        <div className="min-w-[200px] max-w-md">
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <select
            className="input-field"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {subjectOptionLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              {credits} credit{credits !== 1 ? 's' : ''}
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Maximum marks: {displayMax}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Pass above {PASS_MARK_THRESHOLD}
            </span>
          </div>
        )}

        {!subjectId ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Select a subject to enter marks for students.
          </p>
        ) : loadingRoster ? (
          <LoadingSpinner className="min-h-[200px]" />
        ) : students.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20">
            No students in this class yet.
          </p>
        ) : isEditing ? (
          <ul className="space-y-2">
            {students.map((s) => (
              <li
                key={s._id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700"
              >
                <div>
                  <p className="font-medium">{s.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">Roll no: {s.rollNo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={displayMax}
                    step={1}
                    className="input-field w-28"
                    placeholder={`0–${displayMax}`}
                    value={marks[s._id] ?? ''}
                    onChange={(e) => setMarks((prev) => ({ ...prev, [s._id]: e.target.value }))}
                  />
                  <span className="text-sm text-gray-500">/ {displayMax}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Marks are saved. Use <strong>Update marks</strong> to change scores. Results are shown in the table below.
          </p>
        )}
      </div>

      {savedResults.length > 0 && (
        <div className="card space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSubject?.name} — students with marks ({savedResults.filter((r) => r.passStatus === 'pass').length} pass,{' '}
              {savedResults.filter((r) => r.passStatus === 'fail').length} fail)
            </p>
          </div>
          <DataTable
            columns={resultColumns}
            data={savedResults}
            loading={false}
            emptyTitle="No results yet"
          />
        </div>
      )}
    </div>
  );
}
