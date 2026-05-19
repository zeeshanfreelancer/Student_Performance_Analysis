import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiDownload, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { studentService } from '../../services/studentService';
import { useDebounce } from '../../hooks/useDebounce';
import { downloadBlob } from '../../utils/helpers';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const debouncedSearch = useDebounce(search);
  const navigate = useNavigate();

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await studentService.delete(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { key: 'rollNo', label: 'Roll No', render: (r) => r.rollNo },
    { key: 'name', label: 'Name', render: (r) => r.user?.name },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    { key: 'class', label: 'Class', render: (r) => r.class?.name },
    { key: 'gpa', label: 'GPA', render: (r) => r.gpa?.toFixed(2) },
    { key: 'attendance', label: 'Attendance', render: (r) => `${r.attendancePercentage}%` },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`rounded-full px-2 py-1 text-xs ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
        {r.status}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Students</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleExport('excel')} className="btn-secondary">
            <FiDownload className="mr-2" /> Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            <FiDownload className="mr-2" /> CSV
          </button>
          <button className="btn-primary"><FiPlus className="mr-2" /> Add Student</button>
        </div>
      </div>

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
          onRowClick={(row) => navigate(`/admin/students/${row._id}`)}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${row._id}`); }} className="p-1 hover:text-primary-600"><FiEye /></button>
              <button className="p-1 hover:text-primary-600"><FiEdit /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }} className="p-1 hover:text-red-600"><FiTrash2 /></button>
            </div>
          )}
        />
        <Pagination page={page} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
