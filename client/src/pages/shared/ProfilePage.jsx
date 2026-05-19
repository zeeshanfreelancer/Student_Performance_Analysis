import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { getInitials } from '../../utils/helpers';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [image, setImage] = useState(null);
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone, address: user?.address, gender: user?.gender },
  });
  const { register: regPw, handleSubmit: submitPw } = useForm();

  const onUpdateProfile = async (data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => v && formData.append(k, v));
      if (image) formData.append('profileImage', image);
      await authService.updateProfile(formData);
      await fetchMe();
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const onChangePassword = async (data) => {
    try {
      await authService.changePassword(data);
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card flex items-center gap-6">
        {user?.profileImage ? (
          <img src={user.profileImage} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
            {getInitials(user?.name)}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <p className="mt-1 capitalize text-sm text-primary-600">{user?.role}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onUpdateProfile)} className="card space-y-4">
        <h3 className="font-semibold">Edit Profile</h3>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        <input className="input-field" placeholder="Name" {...register('name')} />
        <input className="input-field" placeholder="Phone" {...register('phone')} />
        <input className="input-field" placeholder="Address" {...register('address')} />
        <select className="input-field" {...register('gender')}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="btn-primary">Save Changes</button>
      </form>

      <form onSubmit={submitPw(onChangePassword)} className="card space-y-4">
        <h3 className="font-semibold">Change Password</h3>
        <input type="password" className="input-field" placeholder="Current password" {...regPw('currentPassword', { required: true })} />
        <input type="password" className="input-field" placeholder="New password" {...regPw('newPassword', { required: true, minLength: 6 })} />
        <button type="submit" className="btn-primary">Update Password</button>
      </form>
    </div>
  );
}
