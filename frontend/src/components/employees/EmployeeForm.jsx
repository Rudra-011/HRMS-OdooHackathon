import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    department: '',
    jobPosition: '',
    location: '',
    monthlyWage: '',
    role: 'employee'
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await employeeService.create({
        ...formData,
        monthlyWage: formData.monthlyWage ? Number(formData.monthlyWage) : 0
      });
      toast.success('Employee created successfully!');
      setCreatedCredentials(response.data.credentials);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  if (createdCredentials) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Employee Created!</h2>
          <p className="text-gray-600 mb-6">Login credentials have been sent to the employee's email.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Credentials:</h3>
            <p className="text-sm text-gray-600"><strong>Login ID:</strong> {createdCredentials.loginId}</p>
            <p className="text-sm text-gray-600"><strong>Email:</strong> {createdCredentials.email}</p>
            <p className="text-sm text-gray-600"><strong>Temporary Password:</strong> {createdCredentials.temporaryPassword}</p>
          </div>

          <div className="flex space-x-3 justify-center">
            <button onClick={() => {
              setCreatedCredentials(null);
              setFormData({
                firstName: '', lastName: '', email: '', phone: '',
                dateOfJoining: new Date().toISOString().split('T')[0],
                department: '', jobPosition: '', location: '', monthlyWage: '', role: 'employee'
              });
            }} className="btn-primary">
              Add Another
            </button>
            <button onClick={() => navigate('/employees')} className="btn-secondary">
              Go to Employees
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">New Employee</h1>
          <p className="text-sm text-gray-500">Create a new employee account</p>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Job Position</label>
              <input
                type="text"
                name="jobPosition"
                value={formData.jobPosition}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date of Joining *</label>
              <input
                type="date"
                name="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Salary & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Monthly Wage (₹)</label>
              <input
                type="number"
                name="monthlyWage"
                value={formData.monthlyWage}
                onChange={handleChange}
                className="input-field"
                min="0"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="employee">Employee</option>
                <option value="hr_officer">HR Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A Login ID and temporary password will be auto-generated and sent to the employee's email. 
              The employee can change their password after first login.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;