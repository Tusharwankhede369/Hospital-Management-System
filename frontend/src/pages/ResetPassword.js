import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/login.css';
import '../css/auth-pages.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Request a new code from login.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-shell">
          <div className="auth-card" style={{ maxWidth: 480 }}>
            <h2>Password reset</h2>
            <p className="subtitle">Your password has been updated. Redirecting to login…</p>
          </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <h2>Reset password</h2>
          <p className="subtitle">Enter your email, the 6-digit code from your email, and a new password.</p>
          {error && (
            <div className="login-alert-error" role="alert">
              {error}
            </div>
          )}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-otp">6-digit code from email</label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-confirm">Confirm password</label>
              <input
                id="reset-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
          <div className="login-footer">
            <button type="button" className="login-back-link" onClick={() => navigate('/login')}>
              Back to login
            </button>
          </div>
        </div>
    </div>
  );
};

export default ResetPassword;
