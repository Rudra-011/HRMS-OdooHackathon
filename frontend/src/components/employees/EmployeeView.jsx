import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import LoadingSpinner from '../common/LoadingSpinner';
import { HiArrowLeft, HiMail, HiPhone, HiLocationMarker, HiOfficeBuilding } from 'react-icons/hi';
import { getInitials, formatDate } from '../../utils/helpers';

const EmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getById(id);
      setEmployee(response.data.employee);
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!employee) return <div className="text-center py-12">Employee not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title">Employee Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
            {employee.avatar ? (
              <img src={employee.avatar} alt={employee.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-primary-700 font-bold text-3xl">
                {getInitials(employee.firstName, employee.lastName)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-gray-600 mt-1">{employee.jobPosition || 'No position assigned'}</p>
            
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {employee.user?.email && (
                <span className="flex items-center">
                  <HiMail className="w-4 h-4 mr-1" /> {employee.user.email}
                </span>
              )}
              {employee.phone && (
                <span className="flex items-center">
                  <HiPhone className="w-4 h-4 mr-1" /> {employee.phone}
                </span>
              )}
              {employee.department && (
                <span className="flex items-center">
                  <HiOfficeBuilding className="w-4 h-4 mr-1" /> {employee.department}
                </span>
              )}
              {employee.location && (
                <span className="flex items-center">
                  <HiLocationMarker className="w-4 h-4 mr-1" /> {employee.location}
                </span>
              )}
            </div>
          </div>

          {/* Employee Code */}
          <div className="text-right">
            <p className="text-xs text-gray-400">Employee Code</p>
            <p className="font-mono text-sm font-medium text-gray-700">{employee.employeeCode}</p>
            {employee.user?.loginId && (
              <>
                <p className="text-xs text-gray-400 mt-2">Login ID</p>
                <p className="font-mono text-sm font-medium text-gray-700">{employee.user.loginId}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      {(isAdmin || user?.employee?.id === employee._id) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <dl className="space-y-3">
              <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <InfoRow label="Gender" value={employee.gender || '-'} />
              <InfoRow label="Marital Status" value={employee.maritalStatus || '-'} />
              <InfoRow label="Nationality" value={employee.nationality || '-'} />
              <InfoRow label="Personal Email" value={employee.personalEmail || '-'} />
              <InfoRow label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
            </dl>
          </div>

          {/* Job Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
            <dl className="space-y-3">
              <InfoRow label="Position" value={employee.jobPosition || '-'} />
              <InfoRow label="Department" value={employee.department || '-'} />
              <InfoRow label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'} />
              <InfoRow label="Location" value={employee.location || '-'} />
              <InfoRow label="Status" value={employee.workStatus || '-'} />
            </dl>
          </div>

          {/* Bank Details - Admin only */}
          {isAdmin && employee.bankDetails && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
              <dl className="space-y-3">
                <InfoRow label="Account Number" value={employee.bankDetails.accountNumber || '-'} />
                <InfoRow label="Bank Name" value={employee.bankDetails.bankName || '-'} />
                <InfoRow label="IFSC Code" value={employee.bankDetails.ifscCode || '-'} />
                <InfoRow label="PAN No" value={employee.bankDetails.panNo || '-'} />
                <InfoRow label="UAN No" value={employee.bankDetails.uanNo || '-'} />
              </dl>
            </div>
          )}

          {/* Skills & About */}
          {employee.about && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-600 text-sm">{employee.about}</p>
              
              {employee.skills && employee.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-medium text-gray-900 capitalize">{value}</dd>
  </div>
);

export default EmployeeView;