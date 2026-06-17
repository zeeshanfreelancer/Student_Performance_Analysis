import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiDownload, FiEdit, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import CreateStudentModal from '../../components/accounts/CreateStudentModal';
import EditStudentModal from '../../components/accounts/EditStudentModal';
import CreateParentModal from '../../components/accounts/CreateParentModal';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { useDebounce } from '../../hooks/useDebounce';
import { downloadBlob } from '../../utils/helpers';
import { STUDENT_STATUS } from '../../utils/constants';

export default function StudentsPage() {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const canCreateParent = user?.role === 'admin' || user?.role === 'teacher';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (!isTeacher && user?.role !== 'admin') return;
    classService
      .getAll()
      .then(({ data }) => setClassOptions(data.data.classes || []))
      .catch(() => {});
  }, [isTeacher, user?.role]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll({
        page,
        limit: 10,
        search: debouncedSearch,
        ...filters,
      });
      setStudents(data.data.students);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [page, debouncedSearch, filters]);

  const handleExport = async (format) => {
    try {
      const { data } = await studentService.export(format);
      downloadBlob(data, `students.${format === 'csv' ? 'csv' : 'xlsx'}`);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const openEdit = (row) => {
    setEditStudentId(row._id);
    setEditModalOpen(true);
  };

  const handleStatusChange = async (student, status) => {
    if (student.status === status) return;
    try {
      await studentService.updateStatus(student._id, status);
      toast.success(`Student marked as ${STUDENT_STATUS[status]?.label || status}`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const columns = [
    { key: 'rollNo', label: 'Roll No', render: (r) => r.rollNo },
    { key: 'name', label: 'Name', render: (r) => r.user?.name },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    {
      key: 'parent',
      label: 'Parent',
      render: (r) =>
        r.parentId?.user?.name ? (
          <span className="text-sm">{r.parentId.user.name}</span>
        ) : (
          <span className="text-sm text-amber-600">Not linked</span>
        ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (r) => (r.class ? `${r.class.name} ${r.class.section || ''}`.trim() : '—'),
    },
    { key: 'gpa', label: 'GPA', render: (r) => r.gpa?.toFixed(2) },
    { key: 'attendance', label: 'Attendance', render: (r) => `${r.attendancePercentage}%` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        if (user?.role === 'admin') {
          return (
            <select
              className="input-field py-1 text-xs sm:w-28"
              value={r.status === 'graduated' ? 'completed' : r.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusChange(r, e.target.value);
              }}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="left">Left</option>
            </select>
          );
        }
        const meta = STUDENT_STATUS[r.status] || { label: r.status, color: 'bg-gray-100' };
        return (
          <span className={`rounded-full px-2 py-1 text-xs ${meta.color}`}>
            {meta.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Students</h2>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'admin' && (
            <>
              <button type="button" onClick={() => handleExport('excel')} className="btn-secondary">
                <FiDownload className="mr-2 inline" /> Excel
              </button>
              <button type="button" onClick={() => handleExport('csv')} className="btn-secondary">
                <FiDownload className="mr-2 inline" /> CSV
              </button>
            </>
          )}
          {canCreateParent && (
            <button type="button" onClick={() => setParentModalOpen(true)} className="btn-secondary">
              <FiUserPlus className="mr-2 inline" /> Add Parent
            </button>
          )}
          <button type="button" onClick={() => setStudentModalOpen(true)} className="btn-primary">
            <FiPlus className="mr-2 inline" /> Add Student
          </button>
        </div>
      </div>

      {isTeacher && classOptions.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          No classes are assigned to you yet. Ask an admin to create a class and assign you as the teacher, then you can add students here.
        </p>
      )}

      <div className="card space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {classOptions.length > 0 && (
            <select
              className="input-field sm:w-48"
              value={filters.class || ''}
              onChange={(e) => setFilters({ ...filters, class: e.target.value || undefined })}
            >
              <option value="">All classes</option>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.section} ({c.academicYear})
                </option>
              ))}
            </select>
          )}
          {user?.role === 'admin' && (
            <select
              className="input-field sm:w-48"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="left">Left</option>
            </select>
          )}
          <select
            className="input-field sm:w-48"
            onChange={(e) => setFilters({ ...filters, attendanceBelow: e.target.value || undefined })}
          >
            <option value="">All Attendance</option>
            <option value="75">Below 75%</option>
          </select>
          <select
            className="input-field sm:w-48"
            onChange={(e) => setFilters({ ...filters, gpaBelow: e.target.value || undefined })}
          >
            <option value="">All GPA</option>
            <option value="2.5">GPA below 2.5</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          emptyTitle="No students found"
          actions={
            (isTeacher || user?.role === 'admin')
              ? (row) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                      className="btn-secondary py-1.5 text-xs"
                      title="Edit student"
                    >
                      <FiEdit className="mr-1 inline" /> Edit
                    </button>
                  </div>
                )
              : undefined
          }
        />
        <Pagination page={page} total={total} onPageChange={setPage} />
      </div>

      <CreateStudentModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSuccess={fetchStudents}
      />
      <EditStudentModal
        open={editModalOpen}
        studentId={editStudentId}
        onClose={() => { setEditModalOpen(false); setEditStudentId(null); }}
        onSuccess={fetchStudents}
      />
      <CreateParentModal
        open={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
}
