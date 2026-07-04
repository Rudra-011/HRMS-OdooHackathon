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