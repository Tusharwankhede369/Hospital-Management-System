import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import '../css/login.css';

const LOTTIE_URL = 'https://lottie.host/1dce6bb8-0bd4-44b4-a58e-4da2ed7ffbeb/FX3jISBjBg.lottie';

const Login = () => {
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(formData.emailOrPhone, formData.password);
    if (result.success) {
      const role = result.user?.role || 'patient';
      const dashboardPath = {
        patient: '/patient',
        doctor: '/doctor',
        staff: '/staff',
        hr: '/hr',
        admin: '/admin',
        owner: '/admin',
        admin_manager: '/admin',
      }[role] || '/patient';
      navigate(dashboardPath);
    } else {
      setError(result.message);
    }
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail });
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        password: newPassword,
      });
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess(false);
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgot = () => {
    setShowForgot(true);
    setForgotStep(1);
    setForgotSuccess(false);
    setForgotError('');
    setForgotEmail(formData.emailOrPhone.includes('@') ? formData.emailOrPhone : '');
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-lottie-wrap">
          <DotLottieReact src={LOTTIE_URL} loop autoplay />
        </div>
        <h1>Hospital Management System</h1>
        <p className="tagline">Sign in with email or phone</p>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="subtitle">Enter your email or phone and password</p>

          {error && (
            <div className="login-alert-error" role="alert">
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email or phone</label>
              <input
                id="login-email"
                type="text"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleChange}
                placeholder="email@example.com or 9876543210"
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <div className="login-password-row">
                <label htmlFor="login-password">Password</label>
                <button type="button" className="login-forgot-link" onClick={openForgot}>
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-login">
              Login
            </button>
          </form>

          {showForgot && (
            <div className="login-forgot-overlay" onClick={() => !forgotLoading && setShowForgot(false)}>
              <div className="login-forgot-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="login-forgot-close" onClick={() => setShowForgot(false)} aria-label="Close">
                  ×
                </button>
                <h3>Forgot password</h3>
                {forgotSuccess ? (
                  <p className="login-forgot-success-msg">Password updated. You can close this and login.</p>
                ) : forgotStep === 1 ? (
                  <>
                    <p className="login-forgot-hint">Enter your email. We’ll send a 6-digit code to reset your password.</p>
                    <form onSubmit={handleForgotSendOtp}>
                      {forgotError && <div className="login-alert-error">{forgotError}</div>}
                      <div className="form-group">
                        <label htmlFor="forgot-email">Email</label>
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="btn-login" disabled={forgotLoading}>
                        {forgotLoading ? 'Sending…' : 'Send code to email'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <p className="login-forgot-hint">Enter the 6-digit code from your email and your new password.</p>
                    <form onSubmit={handleForgotReset}>
                      {forgotError && <div className="login-alert-error">{forgotError}</div>}
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={forgotEmail} readOnly disabled style={{ opacity: 0.8 }} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="forgot-otp">Code from email</label>
                        <input
                          id="forgot-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="forgot-new-pw">New password</label>
                        <input
                          id="forgot-new-pw"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="forgot-confirm-pw">Confirm password</label>
                        <input
                          id="forgot-confirm-pw"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          required
                          minLength={6}
                        />
                      </div>
                      <button type="submit" className="btn-login" disabled={forgotLoading}>
                        {forgotLoading ? 'Updating…' : 'Set new password'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="login-footer">
            <p>Don&apos;t have an account?</p>
            <div className="login-links">
              <a href="/register">Register as Patient</a>
              <a href="/register/admin">Bootstrap Owner (first time only)</a>
            </div>
            <p className="login-note">
              Doctor, Staff and HR accounts are created by admin panel. Additional admins are owner-approved manager accounts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
