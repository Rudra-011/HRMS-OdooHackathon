import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';

import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeForm from './components/employees/EmployeeForm';
import EmployeeView from './components/employees/EmployeeView';
import MyProfile from './components/profile/MyProfile';
import AttendanceAdmin from './components/attendance/AttendanceAdmin';
import AttendanceEmployee from './components/attendance/AttendanceEmployee';
import TimeOffAdmin from './components/timeoff/TimeOffAdmin';
import TimeOffEmployee from './components/timeoff/TimeOffEmployee';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function RoleGuard({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) {
    return <Navigate to="/employees" replace />;
  }
  return children;
}

function AuthCallback() {
  const { initAuth } = useAuth();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    if (token && refresh) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refresh);
      initAuth();
    }
    window.location.href = '/employees';
  }, []);
  
  return <LoadingSpinner fullScreen />;
}

function AttendanceRouter() {
  const { user } = useAuth();
  return ['admin', 'hr_officer'].includes(user?.role) 
    ? <AttendanceAdmin /> 
    : <AttendanceEmployee />;
}

function TimeOffRouter() {
  const { user } = useAuth();
  return ['admin', 'hr_officer'].includes(user?.role)
    ? <TimeOffAdmin />
    : <TimeOffEmployee />;
}

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' }
        }}
      />
      
      <Routes>
        <Route path="/signin" element={
          isAuthenticated ? <Navigate to="/employees" replace /> : <SignIn />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/employees" replace /> : <SignUp />
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={
              <RoleGuard roles={['admin', 'hr_officer']}>
                <EmployeeForm />
              </RoleGuard>
            } />
            <Route path="/employees/:id" element={<EmployeeView />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/attendance" element={<AttendanceRouter />} />
            <Route path="/timeoff" element={<TimeOffRouter />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? "/employees" : "/signin"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;