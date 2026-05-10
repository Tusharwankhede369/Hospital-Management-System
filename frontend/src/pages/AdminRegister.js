import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/auth-pages.css';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registrationKey: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canBootstrapOwner, setCanBootstrapOwner] = useState(true);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/api/auth/admin-bootstrap-status');
        setCanBootstrapOwner(Boolean(res.data?.canBootstrapOwner));
      } catch (_) {
        setCanBootstrapOwner(false);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/auth/register-admin', formData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccess('Owner account created successfully! Redirecting...');
        setTimeout(() => navigate('/admin'), 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  if (checking) {
    return <div className="loading">Checking owner bootstrap status...</div>;
  }

  if (!canBootstrapOwner) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <h2>Owner Registration Closed</h2>
          <p style={{ marginTop: 8 }}>
            Owner/admin already exists. Additional admin managers must be created from the owner account inside admin panel.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Owner Registration</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
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
            <label>Account password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Set secure account password"
              required
            />
          </div>
          <div className="form-group">
            <label>Owner bootstrap key *</label>
            <input
              type="password"
              name="registrationKey"
              value={formData.registrationKey}
              onChange={handleChange}
              placeholder="Owner setup key"
              required
            />
            <small style={{ color: '#666' }}>Used only once to create the first owner.</small>
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Create Owner Account
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <a href="/login">Login</a>
        </p>
        <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          After bootstrap, owner can create multiple admin managers from User Management.
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
