import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/helpers';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({ email });
      setSubmitted(true);
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          If an account exists for that address, we sent a password reset link. The link expires in
          1 hour. Check your spam folder if you do not see it.
        </p>
        <Link to="/login" className="btn-primary mt-8 inline-block w-full text-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password</h2>
      <p className="mt-1 text-sm text-gray-500">
        Enter your email and we will send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="input-field"
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending...' : 'Send reset link'}
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
