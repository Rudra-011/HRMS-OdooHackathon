const AppError = require('../utils/AppError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

const isAdminOrHR = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!['admin', 'hr_officer'].includes(req.user.role)) {
    return next(new AppError('Admin or HR officer access required.', 403));
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};

const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  const requestedId = req.params.employeeId || req.params.id;
  const isOwner = req.user.employee && req.user.employee._id.toString() === requestedId;
  const isAdminOrHRUser = ['admin', 'hr_officer'].includes(req.user.role);

  if (!isOwner && !isAdminOrHRUser) {
    return next(new AppError('You can only access your own records.', 403));
  }
  next();
};

// Middleware to check if user can create specific roles
const canCreateRole = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  const targetRole = req.body.role || 'employee';

  if (targetRole === 'admin') {
    return next(new AppError('Cannot create admin accounts.', 403));
  }

  if (targetRole === 'hr_officer' && req.user.role !== 'admin') {
    return next(new AppError('Only admin can create HR officers.', 403));
  }

  if (targetRole === 'employee' && !['admin', 'hr_officer'].includes(req.user.role)) {
    return next(new AppError('Only admin or HR can create employees.', 403));
  }

  next();
};

module.exports = { authorize, isAdminOrHR, isAdmin, isSelfOrAdmin, canCreateRole };