import React from 'react';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status, label }) => {
  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {label || status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
};

export default StatusBadge;