import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match!' });
    }
    setLoading(true);
    setMessage(null);
    try {
      const { firstName, lastName, email, phone, password, confirmPassword } = formData;
      const response = await authService.signUp({ firstName, lastName, email, phone, password, confirmPassword });
      setMessage({
        type: 'success',
        text: response.message || 'Registration submitted. Please verify your email and await HR approval.'
      });
      // Redirect to signin after 4 seconds
      setTimeout(() => navigate('/signin'), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white font-bold text-xl">HR</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Registration</h1>
          <p className="text-gray-500 mt-1">Apply for your HRMS account</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' && <HiCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-semibold">{message.type === 'success' ? 'Registration Submitted!' : 'Error'}</p>
              <p className="mt-0.5">{message.text}</p>
              {message.type === 'success' && (
                <p className="mt-1 text-xs text-green-600">
                  Next steps: Check your email for a verification link. Your account will be active after HR approval.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              placeholder="john.doe@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition pr-10"
                  placeholder="Min 8 chars"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="Repeat password"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Password must contain uppercase, lowercase, number, and special character (@$!%*?&).
          </p>

          <button
            type="submit"
            disabled={loading || message?.type === 'success'}
            className="w-full bg-primary-600 text-white rounded-lg py-3 mt-2 font-medium hover:bg-primary-700 disabled:opacity-70 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : message?.type === 'success' ? 'Registration Submitted ✓' : 'Register as Employee'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary-600 font-medium hover:text-primary-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;