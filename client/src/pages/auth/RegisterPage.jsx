import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/constants';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'admin', label: 'Admin' },
];

export default function RegisterPage() {
  const { register: reg, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Account created!');
      navigate(getDashboardPath(result.payload.role));
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
      <p className="mt-1 text-sm text-gray-500">Register to get started with School ERP</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input className="input-field" {...reg('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input type="email" className="input-field" {...reg('email', { required: true })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input type="password" className="input-field" {...reg('password', { required: true, minLength: 6 })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select className="input-field" {...reg('role', { required: true })}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
