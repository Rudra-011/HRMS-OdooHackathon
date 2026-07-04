import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import attendanceService from '../../services/attendanceService';
import timeoffService from '../../services/timeoffService';
import { HiClock, HiCalendar, HiUser, HiOfficeBuilding, HiChartBar } from 'react-icons/hi';
import { formatDate, formatTime } from '../../utils/helpers';
import CheckInOut from '../attendance/CheckInOut';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const emp = user?.employee || {};
  const now = new Date();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceRes, statusRes, leaveRes] = await Promise.all([
        attendanceService.getMyAttendance({ month: now.getMonth() + 1, year: now.getFullYear() }),
        attendanceService.getStatus(),
        timeoffService.getMyLeaves({ year: now.getFullYear() })
      ]);
      setAttendanceSummary(attendanceRes.data.summary);
      setTodayRecord(statusRes.data.todayRecord);
      setLeaveData(leaveRes.data);
    } catch (error) {
      console.error('Dashboard fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {emp.firstName || 'Employee'}! 👋</h1>
            <p className="text-blue-100 mt-1">{formatDate(now)} • {emp.jobPosition || ''} {emp.department ? `at ${emp.department}` : ''}</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
            </div>
          </div>
        </div>

        {/* Check-in status in banner */}
        <div className="mt-4 flex items-center gap-4">
          {todayRecord?.checkIn && (
            <div className="bg-white/10 rounded-lg px-3 py-2 text-sm">
              <span className="text-blue-200">Checked in at</span>{' '}
              <span className="font-semibold">{formatTime(todayRecord.checkIn)}</span>
            </div>
          )}
          {todayRecord?.checkOut && (
            <div className="bg-white/10 rounded-lg px-3 py-2 text-sm">
              <span className="text-blue-200">Checked out at</span>{' '}
              <span className="font-semibold">{formatTime(todayRecord.checkOut)}</span>
            </div>
          )}
          {!todayRecord?.checkIn && (
            <div className="bg-white/10 rounded-lg px-3 py-2 text-sm text-blue-200">
              Not checked in today
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {!loading && attendanceSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<HiChartBar className="w-5 h-5 text-green-600" />}
            label="Days Present"
            value={attendanceSummary.presentDays || 0}
            sub={`of ${attendanceSummary.totalWorkingDays} working days`}
            bg="bg-green-50"
          />
          <StatCard
            icon={<HiClock className="w-5 h-5 text-blue-600" />}
            label="Hours Worked"
            value={`${parseFloat(attendanceSummary.totalWorkedHours || 0).toFixed(1)}h`}
            sub={`${monthNames[now.getMonth()]}`}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<HiCalendar className="w-5 h-5 text-purple-600" />}
            label="Leaves Used"
            value={attendanceSummary.leaveDays || 0}
            sub="this month"
            bg="bg-purple-50"
          />
          <StatCard
            icon={<HiOfficeBuilding className="w-5 h-5 text-orange-600" />}
            label="Extra Hours"
            value={`${parseFloat(attendanceSummary.totalExtraHours || 0).toFixed(1)}h`}
            sub="overtime"
            bg="bg-orange-50"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <HiCalendar className="w-4 h-4 text-primary-500" />
              Leave Balance {now.getFullYear()}
            </h2>
            <button
              onClick={() => navigate('/timeoff')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Apply Leave →
            </button>
          </div>
          {leaveData?.allocations ? (
            <div className="space-y-3">
              {Object.entries(leaveData.allocations).map(([type, data]) => (
                <LeaveBar
                  key={type}
                  label={type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  used={data.used}
                  total={data.total}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No leave allocations found.</p>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink icon={<HiUser className="w-5 h-5" />} label="My Profile" onClick={() => navigate('/profile')} color="primary" />
            <QuickLink icon={<HiClock className="w-5 h-5" />} label="Attendance" onClick={() => navigate('/attendance')} color="green" />
            <QuickLink icon={<HiCalendar className="w-5 h-5" />} label="Apply Leave" onClick={() => navigate('/timeoff')} color="purple" />
            <QuickLink icon={<HiChartBar className="w-5 h-5" />} label="View Reports" onClick={() => navigate('/attendance')} color="orange" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, bg }) => (
  <div className={`${bg} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
  </div>
);

const LeaveBar = ({ label, used, total }) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(0, total - used);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{remaining} / {total} remaining</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${pct > 75 ? 'bg-red-400' : pct > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const colorMap = {
  primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
  green: 'bg-green-50 text-green-700 hover:bg-green-100',
  purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
};

const QuickLink = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-lg transition text-sm font-medium ${colorMap[color]}`}
  >
    {icon}
    {label}
  </button>
);

export default EmployeeDashboard;
