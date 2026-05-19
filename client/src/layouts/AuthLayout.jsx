import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-white"
        >
          <h1 className="text-4xl font-bold">School ERP</h1>
          <p className="mt-4 text-lg text-primary-100">
            Complete student management, attendance tracking, analytics, and parent portal in one platform.
          </p>
          <ul className="mt-8 space-y-3 text-primary-100">
            <li>Role-based access for Admin, Teacher, Student & Parent</li>
            <li>Real-time attendance & performance analytics</li>
            <li>Assignments, quizzes & instant grading</li>
            <li>PDF reports & Excel exports</li>
          </ul>
        </motion.div>
      </div>
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
