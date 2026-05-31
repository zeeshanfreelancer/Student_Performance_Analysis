import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiCheck, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import { subjectService } from '../../services/subjectService';
import { attendanceService } from '../../services/attendanceService';
import { ATTENDANCE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const toDateInputValue = (d = new Date()) => {
  const local = new Date(d);
  const offset = local.getTimezoneOffset();
  const adjusted = new Date(local.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
};

export default function MarkAttendancePanel() {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subject') || '';
  const today = toDateInputValue();

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
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
      setStatuses({});
      return;
    }
    setLoadingRoster(true);
    try {
      const { data } = await attendanceService.getBySubject(subjectId, date);
      const roster = data.data.students || [];
      const byStudent = data.data.attendanceByStudent || {};

      setStudents(roster);
      const initial = {};
      roster.forEach((s) => {
        const existing = byStudent[s._id];
        initial[s._id] = existing?.status === 'absent' ? 'absent' : 'present';
      });
      setStatuses(initial);
    } catch {
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [subjectId, date]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const setStatus = (studentId, status) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const next = {};
    students.forEach((s) => { next[s._id] = 'present'; });
    setStatuses(next);
  };

  const markAllAbsent = () => {
    const next = {};
    students.forEach((s) => { next[s._id] = 'absent'; });
    setStatuses(next);
  };

  const handleSave = async () => {
    if (!subjectId) {
      toast.error('Select a subject');
      return;
    }
    if (!students.length) {
      toast.error('No students in this class');
      return;
    }

    setSaving(true);
    try {
      await attendanceService.mark({
        subject: subjectId,
        date,
        records: students.map((s) => ({
          student: s._id,
          status: statuses[s._id] || 'present',
        })),
      });
      toast.success(`Attendance saved for ${formatDate(date)}`);
      loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const selectedSubject = subjects.find((s) => s._id === subjectId);
  const isToday = date === today;
  const presentCount = students.filter((s) => statuses[s._id] === 'present').length;
  const absentCount = students.length - presentCount;

  if (loadingSubjects) return <LoadingSpinner className="min-h-[120px]" />;

  if (!subjects.length) {
    return (
      <div className="card rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        No subjects assigned yet. Ask an admin to add subjects and assign them to you.
      </div>
    );
  }

  const subjectOptionLabel = (s) => {
    const cls = s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : '';
    return cls ? `${s.name} (${cls})` : s.name;
  };

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isTeacher ? 'Mark attendance by subject' : 'Mark attendance'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose your subject, then mark each student present or absent.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingRoster || !students.length || !subjectId}
          className="btn-primary shrink-0"
        >
          <FiSave className="mr-2 inline" />
          {saving ? 'Saving…' : 'Save attendance'}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1">
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
        <div className="min-w-[160px]">
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            className="input-field"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDate(today)} className="btn-secondary text-sm">
            Today
          </button>
          <button
            type="button"
            onClick={markAllPresent}
            disabled={!students.length}
            className="btn-secondary text-sm"
          >
            <FiCheck className="mr-1 inline" />
            All present
          </button>
          <button
            type="button"
            onClick={markAllAbsent}
            disabled={!students.length}
            className="btn-secondary text-sm"
          >
            <FiX className="mr-1 inline" />
            All absent
          </button>
        </div>
      </div>

      {selectedSubject && students.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Present: {presentCount}
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Absent: {absentCount}
          </span>
          <span className="text-gray-500">
            {selectedSubject.name} · {formatDate(date)}
            {isToday && ' (Today)'}
          </span>
        </div>
      )}

      {!subjectId ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          Select a subject above to see students.
        </p>
      ) : loadingRoster ? (
        <LoadingSpinner className="min-h-[200px]" />
      ) : students.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20">
          No students in this class yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => {
            const status = statuses[s._id] || 'present';
            const isPresent = status === 'present';
            return (
              <li
                key={s._id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700"
              >
                <div>
                  <p className="font-medium">{s.user?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">Roll no: {s.rollNo}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(s._id, 'present')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition sm:min-w-[120px] sm:flex-none ${
                      isPresent
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    <FiCheck />
                    {ATTENDANCE_STATUS.present.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(s._id, 'absent')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition sm:min-w-[120px] sm:flex-none ${
                      !isPresent
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    <FiX />
                    {ATTENDANCE_STATUS.absent.label}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
