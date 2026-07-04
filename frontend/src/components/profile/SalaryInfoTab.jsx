import React, { useState, useEffect } from 'react';
import salaryService from '../../services/salaryService';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

const SalaryInfoTab = ({ employee, salary: initialSalary, onUpdate }) => {
  const [salary, setSalary] = useState(initialSalary);
  const [editing, setEditing] = useState(false);
  const [monthlyWage, setMonthlyWage] = useState(salary?.monthlyWage || '');
  const [workingDays, setWorkingDays] = useState(salary?.workingDaysPerWeek || 5);
  const [breakTime, setBreakTime] = useState(salary?.breakTimeHours || 1);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!monthlyWage || monthlyWage <= 0) {
      toast.error('Please enter a valid monthly wage');
      return;
    }
    setLoading(true);
    try {
      const response = await salaryService.upsertSalary(employee._id, {
        monthlyWage: Number(monthlyWage),
        workingDaysPerWeek: Number(workingDays),
        breakTimeHours: Number(breakTime)
      });
      setSalary(response.data.salary);
      setEditing(false);
      toast.success('Salary updated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update salary');
    } finally {
      setLoading(false);
    }
  };

  if (!salary && !editing) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500 mb-4">No salary structure defined for this employee.</p>
        <button onClick={() => setEditing(true)} className="btn-primary">
          Define Salary Structure
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wage Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Salary Info</h3>
          <button 
            onClick={() => setEditing(!editing)} 
            className={editing ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-500">Monthly Wage</label>
            {editing ? (
              <input
                type="number"
                value={monthlyWage}
                onChange={(e) => setMonthlyWage(e.target.value)}
                className="input-field mt-1"
              />
            ) : (
              <p className="text-xl font-bold text-gray-900">{formatCurrency(salary?.monthlyWage)}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Yearly Wage</label>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(editing ? monthlyWage * 12 : salary?.yearlyWage)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Working Days / Week</label>
            {editing ? (
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="input-field mt-1"
                min="1" max="7"
              />
            ) : (
              <p className="text-lg font-medium">{salary?.workingDaysPerWeek} days</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Break Time</label>
            {editing ? (
              <input
                type="number"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                className="input-field mt-1"
                min="0" step="0.5"
              />
            ) : (
              <p className="text-lg font-medium">{salary?.breakTimeHours} hrs</p>
            )}
          </div>
        </div>

        {editing && (
          <button onClick={handleSave} disabled={loading} className="btn-primary mt-4">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Salary Components */}
      {salary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Components */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Salary Components</h3>
            <div className="space-y-3">
              {salary.components?.map((component, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{component.name}</p>
                    <p className="text-xs text-gray-500">{component.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(component.amount)} <span className="text-xs text-gray-400">/month</span>
                    </p>
                    {component.percentage > 0 && (
                      <p className="text-xs text-gray-500">{component.percentage}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions & Net */}
          <div className="space-y-6">
            {/* PF */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Provident Fund (PF) Contribution</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Employee ({salary.pfEmployee?.rate}%)</span>
                  <span className="text-sm font-medium">{formatCurrency(salary.pfEmployee?.amount)} /month</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Employer ({salary.pfEmployer?.rate}%)</span>
                  <span className="text-sm font-medium">{formatCurrency(salary.pfEmployer?.amount)} /month</span>
                </div>
              </div>
            </div>

            {/* Tax & Net */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Tax Deductions</h3>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Professional Tax</span>
                <span className="text-sm font-medium">{formatCurrency(salary.professionalTax)} /month</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Gross Salary</span>
                  <span className="text-sm font-bold">{formatCurrency(salary.grossSalary)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm font-medium text-red-600">Total Deductions</span>
                  <span className="text-sm font-bold text-red-600">-{formatCurrency(salary.totalDeductions)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">Net Salary</span>
                  <span className="text-base font-bold text-green-600">{formatCurrency(salary.netSalary)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryInfoTab;