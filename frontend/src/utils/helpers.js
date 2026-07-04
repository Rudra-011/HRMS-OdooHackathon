import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  if (!date) return '-';
  return format(new Date(date), fmt);
};

export const formatTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'HH:mm');
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const calculateDuration = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '-';
  const hours = differenceInHours(new Date(checkOut), new Date(checkIn));
  const mins = differenceInMinutes(new Date(checkOut), new Date(checkIn)) % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

export const getLeaveTypeLabel = (type) => {
  const labels = {
    paid_time_off: 'Paid Time Off',
    sick_leave: 'Sick Leave',
    unpaid_leave: 'Unpaid Leave'
  };
  return labels[type] || type;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    half_day: 'bg-orange-100 text-orange-800',
    on_leave: 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};