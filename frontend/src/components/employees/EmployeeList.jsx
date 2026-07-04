import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import LoadingSpinner from '../common/LoadingSpinner';
import { HiPlus, HiSearch } from 'react-icons/hi';
import { MdFlightTakeoff } from 'react-icons/md';
import { getInitials } from '../../utils/helpers';

const EmployeeList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({});

  const isAdmin = ['admin', 'hr_officer'].includes(user?.role);

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const response = await employeeService.getAll(params);
      setEmployees(response.data.employees);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = (employee) => {
    if (employee.isCheckedIn) {
      return <div className="w-3 h-3 bg-green-500 rounded-full" title="Present"></div>;
    }
    if (employee.workStatus === 'on_leave') {
      return <MdFlightTakeoff className="w-4 h-4 text-blue-500" title="On Leave" />;
    }
    return <div className="w-3 h-3 bg-yellow-500 rounded-full" title="Absent"></div>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total || 0} team members
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* New Employee Button - Admin/HR only */}
          {isAdmin && (
            <Link to="/employees/new" className="btn-primary flex items-center whitespace-nowrap">
              <HiPlus className="w-4 h-4 mr-1" />
              New
            </Link>
          )}
        </div>
      </div>

      {/* Employee Cards Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : employees.length === 0 ? (
        <div className="text-center py-12 card">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
          <p className="text-gray-500">
            {search ? 'Try adjusting your search' : 'Get started by adding your first employee'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {employees.map((employee) => (
            <div
              key={employee._id}
              onClick={() => navigate(`/employees/${employee._id}`)}
              className="card hover:shadow-md hover:border-primary-200 cursor-pointer transition-all duration-200 relative"
            >
              {/* Status indicator */}
              <div className="absolute top-3 right-3">
                {getStatusIndicator(employee)}
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-3 border-2 border-primary-200">
                  {employee.avatar ? (
                    <img
                      src={employee.avatar}
                      alt={employee.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-700 font-semibold text-xl">
                      {getInitials(employee.firstName, employee.lastName)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-medium text-gray-900 text-center">
                  {employee.firstName} {employee.lastName}
                </h3>
                
                {/* Job Position */}
                <p className="text-sm text-gray-500 text-center mt-0.5">
                  {employee.jobPosition || 'No position'}
                </p>

                {/* Department */}
                <p className="text-xs text-gray-400 text-center mt-0.5">
                  {employee.department || ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;