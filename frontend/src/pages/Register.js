import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../css/auth-pages.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContact: { name: '', phone: '', relation: '' }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const { register, verifyEmail: verifyEmailApi } = useContext(AuthContext);
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const result = await register(formData);
    if (result.success && result.requiresVerification) {
      setVerifyEmail(result.email);
      setShowVerify(true);
    } else if (result.success) {
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/patient'), 2000);
    } else {
      setError(result.message);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    const result = await verifyEmailApi(verifyEmail, verifyCode);
    if (result.success) {
      setSuccess('Email verified! Redirecting...');
      setTimeout(() => navigate('/patient'), 1500);
    } else {
      setVerifyError(result.message);
    }
  };

  if (showVerify) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>Verify your email</h2>
          <p style={{ marginBottom: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            We sent a 6-digit code to your email. Only real email addresses can complete registration.
          </p>
          {verifyError && <div className="alert alert-error">{verifyError}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleVerifySubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={verifyEmail} readOnly style={{ background: '#f1f5f9' }} />
            </div>
            <div className="form-group">
              <label>6-digit code from email</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Verify and continue
            </button>
          </form>
          <p style={{ marginTop: '15px', textAlign: 'center' }}>
            <a href="/login">Back to login</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Patient Registration</h2>
        <p style={{ marginBottom: '15px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Email and phone number are required. We will verify your email with a code (no fake emails).
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Phone number * (required)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Blood Group</label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <h4 style={{ marginTop: '20px', marginBottom: '10px' }} className="full">Emergency Contact</h4>
          <div className="form-group full">
            <label>Name</label>
            <input
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Relation</label>
            <input
              type="text"
              name="emergencyContact.relation"
              value={formData.emergencyContact.relation}
              onChange={handleChange}
            />
          </div>
          <div className="auth-actions full">
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register
          </button>
          </div>
          </div>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;

