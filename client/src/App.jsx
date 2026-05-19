import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import ThemeProvider from './context/ThemeProvider';
import AppRoutes from './routes/AppRoutes';
import { fetchMe } from './redux/slices/authSlice';
import { connectSocket } from './services/socketService';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppInitializer({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
      connectSocket(token);
    }
  }, [dispatch, token]);

  if (token && !isAuthenticated && loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <AppInitializer>
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </AppInitializer>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
