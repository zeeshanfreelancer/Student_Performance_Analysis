import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiUsers, FiBook, FiCalendar, FiBarChart2,
  FiFileText, FiHelpCircle, FiMessageSquare, FiActivity, FiX,
} from 'react-icons/fi';
import { NAV_ITEMS } from '../../utils/constants';
import { setMobileMenuOpen } from '../../redux/slices/uiSlice';

const iconMap = {
  dashboard: FiGrid,
  users: FiUsers,
  students: FiBook,
  attendance: FiCalendar,
  analytics: FiBarChart2,
  assignments: FiFileText,
  quizzes: FiHelpCircle,
  chat: FiMessageSquare,
  reports: FiFileText,
  activity: FiActivity,
  profile: FiUsers,
  grades: FiBarChart2,
};

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, mobileMenuOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const items = NAV_ITEMS[user?.role] || [];

  const content = (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">S</div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">School ERP</span>
        <button
          className="ml-auto lg:hidden"
          onClick={() => dispatch(setMobileMenuOpen(false))}
        >
          <FiX />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || FiGrid;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {sidebarOpen && item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 transition-all`}>
        {content}
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => dispatch(setMobileMenuOpen(false))}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
