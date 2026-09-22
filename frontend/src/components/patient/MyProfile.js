import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import api from '../../api';

const calcAge = (dob) => (dob ? moment().diff(moment(dob), 'years') : null);
const calcBmi = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return null;
  const bmi = weightKg / ((heightCm / 100) ** 2);
  return Number(bmi.toFixed(1));
};

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/patient/profile');
      setProfile(res.data);
      setFormData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        gender: res.data.gender || '',
        dateOfBirth: res.data.dateOfBirth ? moment(res.data.dateOfBirth).format('YYYY-MM-DD') : '',
        bloodGroup: res.data.bloodGroup || '',
        heightCm: res.data.heightCm || '',
        weightKg: res.data.weightKg || '',
        allergies: (res.data.allergies || []).join(', '),
        emergencyContact: res.data.emergencyContact || { name: '', phone: '', relation: '' }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completeness = useMemo(() => {
    const checks = [
      formData.name,
      formData.phone,
      formData.address,
      formData.gender,
      formData.dateOfBirth,
      formData.bloodGroup,
      formData.emergencyContact?.name,
      formData.emergencyContact?.phone
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData]);

  const bmi = calcBmi(Number(formData.heightCm), Number(formData.weightKg));
  const age = calcAge(formData.dateOfBirth);
  const initials = (formData.name || 'P').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const handleChange = (e) => {
    if (e.target.name.startsWith('emergencyContact.')) {
      const field = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: { ...formData.emergencyContact, [field]: e.target.value }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const copyValue = async (value, label) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        allergies: formData.allergies
      };
      const res = await api.put('/api/patient/profile', payload);
      setProfile(res.data);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="ph-page">
      <div className="card ph-card" style={{ marginBottom: 16 }}>
        <div className="ph-profile-top">
          <div className="ph-avatar">{initials}</div>
          <div>
            <h2>{formData.name || 'Your profile'}</h2>
            <p>{profile?.email}</p>
            <div className="ph-meta">
              {age != null && <span className="ph-pill">{age} yrs</span>}
              {formData.bloodGroup && <span className="ph-pill">Blood {formData.bloodGroup}</span>}
              {formData.gender && <span className="ph-pill">{formData.gender}</span>}
              {bmi && <span className="ph-pill">BMI {bmi}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="ph-ring" style={{ '--pct': `${completeness}%` }}>
              <span>{completeness}%</span>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: '#5b7390' }}>Complete</p>
          </div>
        </div>
        <div className="ph-toolbar" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={() => copyValue(profile?.email, 'email')}>Copy email</button>
          <button type="button" className="btn btn-secondary" onClick={() => copyValue(formData.phone, 'phone')}>Copy phone</button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel edit' : 'Edit profile'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="ph-kpis">
        <div className="ph-kpi">
          <span>Contact</span>
          <strong style={{ fontSize: 16 }}>{formData.phone || 'Add phone'}</strong>
        </div>
        <div className="ph-kpi">
          <span>Emergency</span>
          <strong style={{ fontSize: 16 }}>{formData.emergencyContact?.name || 'Add contact'}</strong>
        </div>
        <div className="ph-kpi">
          <span>Allergies</span>
          <strong style={{ fontSize: 16 }}>{formData.allergies || 'None listed'}</strong>
        </div>
        <div className="ph-kpi">
          <span>Member since</span>
          <strong style={{ fontSize: 16 }}>{profile?.createdAt ? moment(profile.createdAt).format('MMM YYYY') : '—'}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card ph-card">
        <div className="ph-section-title">
          <h3>Personal details</h3>
        </div>
        <div className="ph-form-grid">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={profile?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} disabled={!editing}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Blood Group</label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} disabled={!editing}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Allergies</label>
            <input
              type="text"
              name="allergies"
              placeholder="e.g. Penicillin, Peanuts"
              value={formData.allergies}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} disabled={!editing} />
          </div>
        </div>

        <h4 style={{ margin: '8px 0 12px' }}>Emergency contact</h4>
        <div className="ph-form-grid">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="emergencyContact.phone" value={formData.emergencyContact?.phone || ''} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Relation</label>
            <input type="text" name="emergencyContact.relation" value={formData.emergencyContact?.relation || ''} onChange={handleChange} disabled={!editing} />
          </div>
        </div>

        {formData.emergencyContact?.phone && (
          <a className="btn btn-success" href={`tel:${formData.emergencyContact.phone}`} style={{ marginRight: 8 }}>
            Call emergency contact
          </a>
        )}
        {editing && (
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}
      </form>
      {copied && <div className="ph-toast">Copied {copied}</div>}
    </div>
  );
};

export default MyProfile;
