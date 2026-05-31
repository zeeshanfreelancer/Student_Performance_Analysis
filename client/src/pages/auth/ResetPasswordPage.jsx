import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/helpers';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async ({ password: newPassword }) => {
    if (!token) {
      toast.error('Invalid reset link. Request a new one from the login page.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.resetPassword({ token, password: newPassword });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid link</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          This password reset link is missing or invalid. Request a new link from the login page.
        </p>
        <Link to="/forgot-password" className="btn-primary mt-8 inline-block w-full text-center">
          Request reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h2>
      <p className="mt-1 text-sm text-gray-500">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input
            type="password"
            className="input-field"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'At least 6 characters' },
            })}
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm password</label>
          <input
            type="password"
            className="input-field"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === password || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Reset password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="text-primary-600 hover:underline dark:text-primary-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
