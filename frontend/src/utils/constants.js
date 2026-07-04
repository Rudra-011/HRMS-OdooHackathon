export const API_BASE_URL = '/api';

export const ROLES = {
  ADMIN: 'admin',
  HR_OFFICER: 'hr_officer',
  EMPLOYEE: 'employee'
};

export const LEAVE_TYPES = {
  paid_time_off: 'Paid Time Off',
  sick_leave: 'Sick Leave',
  unpaid_leave: 'Unpaid Leave'
};

export const LEAVE_STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
};

export const ATTENDANCE_STATUS = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  on_leave: 'On Leave',
  holiday: 'Holiday',
  weekend: 'Weekend'
};

export const WORK_STATUS = {
  active: 'Active',
  on_leave: 'On Leave',
  absent: 'Absent',
  terminated: 'Terminated',
  resigned: 'Resigned'
};

export const REGISTRATION_STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
};

export const STATUS_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  half_day: 'bg-yellow-500',
  on_leave: 'bg-blue-500',
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500'
};

// Role-based navigation items
export const getNavItems = (role) => {
  const common = [
    { label: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Attendance', path: '/attendance', icon: 'clock' },
    { label: 'Time Off', path: '/timeoff', icon: 'calendar' }
  ];

  if (role === ROLES.EMPLOYEE) {
    return [
      ...common,
      { label: 'My Profile', path: '/profile', icon: 'user' }
    ];
  }

  if (role === ROLES.HR_OFFICER) {
    return [
      ...common,
      { label: 'Employees', path: '/employees', icon: 'users' },
      { label: 'Registrations', path: '/registrations', icon: 'user-check' },
      { label: 'My Profile', path: '/profile', icon: 'user' }
    ];
  }

  if (role === ROLES.ADMIN) {
    return [
      ...common,
      { label: 'Employees', path: '/employees', icon: 'users' },
      { label: 'Registrations', path: '/registrations', icon: 'user-check' },
      { label: 'Salary', path: '/salary', icon: 'dollar-sign' },
      { label: 'My Profile', path: '/profile', icon: 'user' }
    ];
  }

  return common;
};