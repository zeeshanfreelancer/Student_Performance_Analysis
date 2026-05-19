import { useSelector, useDispatch } from 'react-redux';
import { login, register, logout, fetchMe, clearError } from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: (data) => dispatch(login(data)),
    register: (data) => dispatch(register(data)),
    logout: () => dispatch(logout()),
    fetchMe: () => dispatch(fetchMe()),
    clearError: () => dispatch(clearError()),
    role: user?.role,
  };
};
