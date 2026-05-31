import { useEffect, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { subjectService } from '../../services/subjectService';
import { exportService } from '../../services/exportService';
import { downloadBlob } from '../../utils/helpers';

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseMonthValue = (value) => {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
};

export default function MonthlyAttendanceExport() {
  const [subjects, setSubjects] = useState([]);
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    subjectService
      .getAll({ status: 'active' })
      .then(({ data }) => setSubjects(data.data.subjects || []))
      .catch(() => {});
  }, []);

  const handleDownload = async (format) => {
    const { year, month } = parseMonthValue(monthValue);
    if (!year || !month) {
      toast.error('Select a month');
      return;
    }

    setLoading(format);
    try {
      const { data } = await exportService.monthlyAttendance({
        year,
        month,
        subject: subjectId || undefined,
        format,
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const selected = subjects.find((s) => s._id === subjectId);
      const suffix = subjectId
        ? selected?.name?.replace(/\s+/g, '-') || 'subject'
        : 'all-subjects';
      downloadBlob(data, `attendance-${year}-${String(month).padStart(2, '0')}-${suffix}.${ext}`);
      toast.success(`Downloaded ${format.toUpperCase()} report`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(null);
    }
  };

  const subjectLabel = (s) => {
    const cls = s.class ? `${s.class.name} ${s.class.section || ''}`.trim() : '';
    return cls ? `${s.name} (${cls})` : s.name;
  };

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Download monthly attendance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Export subject-wise attendance for each day of the month (Excel uses one sheet per subject).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-sm font-medium">Month</label>
          <input
            type="month"
            className="input-field"
            value={monthValue}
            max={currentMonthValue()}
            onChange={(e) => setMonthValue(e.target.value)}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <select
            className="input-field"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">All my subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {subjectLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleDownload('excel')}
            disabled={!!loading}
            className="btn-primary"
          >
            <FiDownload className="mr-2 inline" />
            {loading === 'excel' ? 'Exporting…' : 'Excel (.xlsx)'}
          </button>
          <button
            type="button"
            onClick={() => handleDownload('pdf')}
            disabled={!!loading}
            className="btn-secondary"
          >
            <FiFileText className="mr-2 inline" />
            {loading === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Columns show each day (1–31). P = Present, A = Absent, L = Late, LV = Leave, - = not marked.
      </p>
    </div>
  );
}
