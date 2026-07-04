import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import authService from '../../services/authService';
import { HiUsers, HiUserAdd, HiClock, HiClipboardList, HiCheckCircle, HiXCircle, HiBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEmployees();
    fetchPendingRegistrations();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 6 });
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const response = await authService.getPendingRegistrations();
      setPendingRegistrations(response.data.registrations || []);
    } catch (error) {
      // Non-critical — silently fail
    } finally {
      setPendingLoading(false);
    }
  };

  const handleRegistrationAction = async (id, status) => {
    setActionLoading(id + status);
    try {
      await authService.updateRegistrationStatus(id, { status });
      toast.success(`Registration ${status} successfully`);
      setPendingRegistrations(prev => prev.filter(r => r._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (emp) => {
    const e = emp?.employee || {};
    return `${(e.firstName || '?').charAt(0)}${(e.lastName || '').charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Admin Dashboard' : 'HR Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.employee?.firstName || user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate('/employees/new', { state: { role: 'hr_officer' } })}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition"
            >
              <HiUserAdd className="w-4 h-4" />
              Add HR Officer
            </button>
          )}
          <button
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition"
          >
            <HiUserAdd className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<HiUsers className="w-6 h-6 text-blue-600" />} label="Total Employees" value={employees.length} bg="bg-blue-50" />
        <StatCard icon={<HiClipboardList className="w-6 h-6 text-yellow-600" />} label="Pending Approvals" value={pendingRegistrations.length} bg="bg-yellow-50" onClick={() => document.getElementById('pending-section').scrollIntoView({ behavior: 'smooth' })} />
        <StatCard icon={<HiClock className="w-6 h-6 text-green-600" />} label="Attendance" value="View" bg="bg-green-50" onClick={() => navigate('/attendance')} />
        <StatCard icon={<HiBadgeCheck className="w-6 h-6 text-purple-600" />} label="Time Off" value="Manage" bg="bg-purple-50" onClick={() => navigate('/timeoff')} />
      </div>

      {/* Pending Registrations Section */}
      {!pendingLoading && pendingRegistrations.length > 0 && (
        <div id="pending-section" className="bg-white rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiClipboardList className="w-5 h-5 text-yellow-500" />
              Pending Employee Registrations
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRegistrations.map(reg => (
              <div key={reg._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {getInitials(reg)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {reg.employee?.firstName} {reg.employee?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{reg.email}</p>
                    {reg.employee?.phone && (
                      <p className="text-xs text-gray-400">{reg.employee.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    reg.isEmailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {reg.isEmailVerified ? 'Email Verified' : 'Email Pending'}
                  </span>
                  <button
                    disabled={actionLoading === reg._id + 'approved'}
                    onClick={() => handleRegistrationAction(reg._id, 'approved')}
                    className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm hover:bg-green-100 disabled:opacity-60 transition"
                  >
                    <HiCheckCircle className="w-4 h-4" />
                    {actionLoading === reg._id + 'approved' ? '...' : 'Approve'}
                  </button>
                  <button
                    disabled={actionLoading === reg._id + 'rejected'}
                    onClick={() => handleRegistrationAction(reg._id, 'rejected')}
                    className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 disabled:opacity-60 transition"
                  >
                    <HiXCircle className="w-4 h-4" />
                    {actionLoading === reg._id + 'rejected' ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Employees</h2>
          <button onClick={() => navigate('/employees')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            No employees found. Add your first employee!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => (
              <div
                key={emp._id}
                onClick={() => navigate(`/employees/${emp._id}`)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 cursor-pointer transition group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg flex-shrink-0">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      `${emp.firstName?.charAt(0)}${emp.lastName?.charAt(0)}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{emp.employeeCode}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 truncate">{emp.jobPosition || 'No position'}</p>
                  <p className="text-sm text-gray-500 truncate">{emp.department || 'No department'}</p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-primary-500 group-hover:text-primary-700 transition">View Profile →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, bg, onClick }) => (
  <div
    onClick={onClick}
    className={`${bg} rounded-xl p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
  >
    <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
