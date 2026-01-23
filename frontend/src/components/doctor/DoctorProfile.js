import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/doctor/profile');
      setProfile(res.data);
      setFormData({
        qualification: res.data.qualification || '',
        department: res.data.department || '',
        experience: res.data.experience || '',
        consultationFees: res.data.consultationFees || '',
        workingDays: res.data.workingDays || [],
        workingHours: res.data.workingHours || { start: '', end: '' },
        breakTime: res.data.breakTime || { start: '', end: '' }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name.includes('.')) {
      const [parent, child] = e.target.name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: e.target.value }
      });
    } else if (e.target.type === 'checkbox') {
      const workingDays = formData.workingDays || [];
      if (e.target.checked) {
        setFormData({ ...formData, workingDays: [...workingDays, e.target.value] });
      } else {
        setFormData({ ...formData, workingDays: workingDays.filter(day => day !== e.target.value) });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/doctor/profile', formData);
      setMessage('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div>
      <h2>Doctor Profile</h2>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={profile?.name} disabled />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={profile?.email} disabled />
        </div>
        <div className="form-group">
          <label>Qualification</label>
          <input
            type="text"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Experience (years)</label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Consultation Fees (₹)</label>
          <input
            type="number"
            name="consultationFees"
            value={formData.consultationFees}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Working Days</label>
          {days.map(day => (
            <label key={day} style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                value={day}
                checked={formData.workingDays?.includes(day)}
                onChange={handleChange}
              />
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </label>
          ))}
        </div>
        <div className="form-group">
          <label>Working Hours Start</label>
          <input
            type="time"
            name="workingHours.start"
            value={formData.workingHours?.start}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Working Hours End</label>
          <input
            type="time"
            name="workingHours.end"
            value={formData.workingHours?.end}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Break Time Start</label>
          <input
            type="time"
            name="breakTime.start"
            value={formData.breakTime?.start}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Break Time End</label>
          <input
            type="time"
            name="breakTime.end"
            value={formData.breakTime?.end}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Profile</button>
      </form>
    </div>
  );
};

export default DoctorProfile;

