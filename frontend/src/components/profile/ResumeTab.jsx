import React, { useState } from 'react';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import { HiPencil, HiPlus, HiX } from 'react-icons/hi';

const ResumeTab = ({ employee, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    about: employee.about || '',
    whatILove: employee.whatILove || '',
    interestsAndHobbies: employee.interestsAndHobbies || '',
    skills: employee.skills || [],
  });
  const [newSkill, setNewSkill] = useState('');

  const handleSave = async () => {
    try {
      await employeeService.update(employee._id, formData);
      toast.success('Profile updated!');
      setEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left - About sections */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">About</h3>
            <button onClick={() => setEditing(!editing)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <HiPencil className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="input-label">About Me</label>
                <textarea
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="input-label">What I Love About My Job</label>
                <textarea
                  value={formData.whatILove}
                  onChange={(e) => setFormData({ ...formData, whatILove: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="What do you love about your job?"
                />
              </div>
              <div>
                <label className="input-label">My Interests & Hobbies</label>
                <textarea
                  value={formData.interestsAndHobbies}
                  onChange={(e) => setFormData({ ...formData, interestsAndHobbies: e.target.value })}
                  className="input-field h-24 resize-none"
                  placeholder="Your interests and hobbies..."
                />
              </div>
              <div className="flex space-x-2">
                <button onClick={handleSave} className="btn-primary">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Section title="About Me" content={employee.about} />
              <Section title="What I Love About My Job" content={employee.whatILove} />
              <Section title="My Interests & Hobbies" content={employee.interestsAndHobbies} />
            </div>
          )}
        </div>
      </div>

      {/* Right - Skills & Certifications */}
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(editing ? formData.skills : employee.skills || []).map((skill, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                {skill}
                {editing && (
                  <button onClick={() => removeSkill(skill)} className="ml-1">
                    <HiX className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="input-field text-sm"
                placeholder="Add skill"
              />
              <button onClick={addSkill} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200">
                <HiPlus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Certifications</h3>
          {employee.certifications && employee.certifications.length > 0 ? (
            <div className="space-y-2">
              {employee.certifications.map((cert, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.issuer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No certifications added</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, content }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
    <p className="text-gray-700 text-sm">{content || 'Not provided'}</p>
  </div>
);

export default ResumeTab;