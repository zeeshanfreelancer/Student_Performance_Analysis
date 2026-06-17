export default function AccountCredentialsFields({ register, errors, showPassword = true }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium">Email (login)</label>
        <input
          type="email"
          className="input-field"
          {...register('email', { required: 'Email is required' })}
        />
        {errors?.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>
      {showPassword && (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Leave blank to keep current password"
            {...register('password', {
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          {errors?.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only fill this in when you want to reset the user&apos;s login password.
          </p>
        </div>
      )}
    </div>
  );
}
