import React, { useState } from 'react';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const PrivateInfoTab = ({ employee, isAdmin, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
    gender: employee.gender || '',
    maritalStatus: employee.maritalStatus || '',
    nationality: employee.nationality || '',
    personalEmail: employee.personalEmail || '',
    phone: employee.phone || '',
    residingAddress: employee.residingAddress || { street: '', city: '', state: '', country: '', zipCode: '' },
    bankDetails: employee.bankDetails || { accountNumber: '', bankName: '', ifscCode: '', panNo: '', uanNo: '' }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      await employeeService.update(employee._id, formData);
      toast.success('Information updated!');
      setEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Button */}
      <div className="flex justify-end">
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary text-sm">
            Edit Info
          </button>
        ) : (
          <div className="flex space-x-2">
            <button onClick={handleSave} className="btn-primary text-sm">Save</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
          <div className="space-y-4">
            <Field label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} editing={editing} type="date" displayValue={formatDate(employee.dateOfBirth)} />
            <Field label="Gender" name="gender" value={formData.gender} onChange={handleChange} editing={editing} type="select" options={['male', 'female', 'other']} displayValue={employee.gender} />
            <Field label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} editing={editing} type="select" options={['single', 'married', 'divorced', 'widowed']} displayValue={employee.maritalStatus} />
            <Field label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} editing={editing} displayValue={employee.nationality} />
            <Field label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} editing={editing} type="email" displayValue={employee.personalEmail} />
            <Field label="Phone" name="phone" value={formData.phone} onChange={handleChange} editing={editing} displayValue={employee.phone} />
            <div>
              <span className="text-sm text-gray-500">Date of Joining</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(employee.dateOfJoining)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Employee Code</span>
              <p className="text-sm font-medium text-gray-900 font-mono">{employee.employeeCode}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
          <div className="space-y-4">
            <Field label="Account Number" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange} editing={editing && isAdmin} displayValue={employee.bankDetails?.accountNumber} />
            <Field label="Bank Name" name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleChange} editing={editing && isAdmin} displayValue={employee.bankDetails?.bankName} />
            <Field label="IFSC Code" name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange} editing={editing && isAdmin} displayValue={employee.bankDetails?.ifscCode} />
            <Field label="PAN No" name="bankDetails.panNo" value={formData.bankDetails.panNo} onChange={handleChange} editing={editing && isAdmin} displayValue={employee.bankDetails?.panNo} />
            <Field label="UAN No" name="bankDetails.uanNo" value={formData.bankDetails.uanNo} onChange={handleChange} editing={editing && isAdmin} displayValue={employee.bankDetails?.uanNo} />
          </div>
        </div>

        {/* Address */}
        <div className="card md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Residing Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Street" name="residingAddress.street" value={formData.residingAddress.street} onChange={handleChange} editing={editing} displayValue={employee.residingAddress?.street} />
            <Field label="City" name="residingAddress.city" value={formData.residingAddress.city} onChange={handleChange} editing={editing} displayValue={employee.residingAddress?.city} />
            <Field label="State" name="residingAddress.state" value={formData.residingAddress.state} onChange={handleChange} editing={editing} displayValue={employee.residingAddress?.state} />
            <Field label="Country" name="residingAddress.country" value={formData.residingAddress.country} onChange={handleChange} editing={editing} displayValue={employee.residingAddress?.country} />
            <Field label="Zip Code" name="residingAddress.zipCode" value={formData.residingAddress.zipCode} onChange={handleChange} editing={editing} displayValue={employee.residingAddress?.zipCode} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, editing, type = 'text', options, displayValue }) => {
  if (!editing) {
    return (
      <div>
        <span className="text-sm text-gray-500">{label}</span>
        <p className="text-sm font-medium text-gray-900 capitalize">{displayValue || '-'}</p>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div>
        <label className="input-label">{label}</label>
        <select name={name} value={value} onChange={onChange} className="input-field">
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="input-label">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} className="input-field" />
    </div>
  );
};

export default PrivateInfoTab;