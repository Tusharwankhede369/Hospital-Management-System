import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import "../css/login.css"

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(formData.email, formData.password);
    if (result.success) {
      const role = result.user?.role || 'patient';
      const dashboardPath = {
        'patient': '/patient',
        'doctor': '/doctor',
        'staff': '/staff',
        'hr': '/hr',
        'admin': '/admin'
      }[role] || '/patient';
      navigate(dashboardPath);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: '400px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Hospital Management System</h2>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Login</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <p>Don't have an account?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
            <a href="/register">Register as Patient</a>
            <a href="/register/admin">Register as Admin</a>
          </div>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Doctor, Staff and HR accounts are created by Admin only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

