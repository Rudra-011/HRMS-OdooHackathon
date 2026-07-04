import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import salaryService from '../../services/salaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ResumeTab from './ResumeTab';
import PrivateInfoTab from './PrivateInfoTab';
import SalaryInfoTab from './SalaryInfoTab';
import SecurityTab from './SecurityTab';
import { HiPencil } from 'react-icons/hi';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resume');
  const [editing, setEditing] = useState(false);

  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);
  const employeeId = user?.employee?.id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (employeeId) {
        const empRes = await employeeService.getById(employeeId);
        setEmployee(empRes.data.employee);

        if (isAdmin) {
          try {
            const salRes = await salaryService.getEmployeeSalary(employeeId);
            setSalary(salRes.data.salary);
          } catch (e) {
            // No salary data yet
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await employeeService.uploadAvatar(employeeId, file);
      toast.success('Avatar updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isAdmin ? [{ id: 'salary', label: 'Salary Info' }] : []),
    { id: 'security', label: 'Security' }
  ];

  if (loading) return <LoadingSpinner />;
  if (!employee) return <div>Profile not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="page-title mb-6">My Profile</h1>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar with edit */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
              {employee.avatar ? (
                <img src={employee.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-primary-700 font-bold text-3xl">
                  {getInitials(employee.firstName, employee.lastName)}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <HiPencil className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
              <InfoItem label="Job Position" value={employee.jobPosition} />
              <InfoItem label="Company" value={employee.company?.name} />
              <InfoItem label="Email" value={user?.email} />
              <InfoItem label="Department" value={employee.department} />
              <InfoItem label="Mobile" value={employee.phone} />
              <InfoItem label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'} />
              <InfoItem label="Login ID" value={user?.loginId} />
              <InfoItem label="Location" value={employee.location} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'resume' && <ResumeTab employee={employee} onUpdate={fetchData} />}
        {activeTab === 'private' && <PrivateInfoTab employee={employee} isAdmin={isAdmin} onUpdate={fetchData} />}
        {activeTab === 'salary' && isAdmin && <SalaryInfoTab employee={employee} salary={salary} onUpdate={fetchData} />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <span className="text-gray-400 text-xs">{label}</span>
    <p className="text-gray-700 font-medium">{value || '-'}</p>
  </div>
);

export default MyProfile;