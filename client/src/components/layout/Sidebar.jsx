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

function SidebarContent({ collapsed, showClose, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const items = NAV_ITEMS[user?.role] || [];

  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <motion.div
        className={`flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800 ${
          collapsed ? 'justify-center px-2' : 'gap-2 px-4'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
          S
        </div>
        {!collapsed && (
          <span className="truncate text-lg font-bold text-gray-900 dark:text-white">
            School ERP
          </span>
        )}
        {showClose && (
          <button
            type="button"
            aria-label="Close menu"
            className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </motion.div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || FiGrid;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default function Sidebar() {
  const { sidebarOpen, mobileMenuOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  const closeMobile = () => dispatch(setMobileMenuOpen(false));

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden shrink-0 transition-[width] duration-300 ease-in-out lg:block ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent collapsed={!sidebarOpen} showClose={false} />
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={closeMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <SidebarContent collapsed={false} showClose onClose={closeMobile} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
