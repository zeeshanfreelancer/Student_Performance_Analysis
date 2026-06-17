import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/constants';
import { getErrorMessage } from '../../utils/helpers';

export default function LoginPage() {
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    try {
      const loggedInUser = await login({
        ...data,
        email: data.email.trim().toLowerCase(),
        rememberMe,
      }).unwrap();
      toast.success('Welcome back!');
      const role = loggedInUser?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
      if (role) {
        navigate(getDashboardPath(role), { replace: true });
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : getErrorMessage(err));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in</h2>
      <p className="mt-1 text-sm text-gray-500">Enter your credentials to access your account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="input-field"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            className="input-field"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:underline dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Accounts are created by your school administrator.
      </p>
    </div>
  );
}
