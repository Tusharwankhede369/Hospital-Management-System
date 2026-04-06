import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Restore user from localStorage on initial mount for faster route access
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (token && !isFetching) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsFetching(true);
      fetchUser();
    } else if (!token) {
      // No token - check if we have a stored user
      // If no stored user, definitely not logged in
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        // No token and no stored user = not logged in
        setUser(null);
        setLoading(false);
      } else {
        // We have stored user but no token - might be expired
        // Keep the user temporarily to allow direct navigation
        // The user is already set from initial state, but ensure it's set
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.role) {
            setUser(parsedUser);
          } else {
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (e) {
          setUser(null);
          localStorage.removeItem('user');
        }
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      console.log('User data from API:', res.data);
      // Ensure we have valid user data
      if (res.data && res.data.role) {
        setUser(res.data);
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(res.data));
        setLoading(false);
        setIsFetching(false);
      } else {
        console.warn('Invalid user data received - missing role:', res.data);
        // Invalid response - use stored user if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.role) {
              setUser(parsedUser);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
        setIsFetching(false);
      }
    } catch (error) {
      console.log('API Error:', error.response?.status, error.message);
      // Only clear on authentication errors (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Auth error - clearing user data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        setLoading(false);
        setIsFetching(false);
      } else {
        // For network errors or other errors, keep the stored user
        // This allows direct navigation to work even if backend is temporarily unavailable
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.role) {
              console.log('Network error - keeping stored user:', parsedUser.role);
              setUser(parsedUser);
            } else {
              setUser(null);
            }
          } catch (e) {
            // If parsing fails, clear it
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          // No stored user and API failed - user is not logged in
          setUser(null);
        }
        setLoading(false);
        setIsFetching(false);
      }
    }
  };

  // Login with email + password OR phone + password
  const login = async (emailOrPhone, password) => {
    try {
      const body = emailOrPhone.includes('@')
        ? { email: emailOrPhone.trim(), password }
        : { phone: emailOrPhone.trim(), password };
      const res = await api.post('/api/auth/login', body);
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/api/auth/register', userData);
      if (res.data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: res.data.email,
          message: res.data.message
        };
      }
      const { token: newToken, user: userDataRes } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(userDataRes);
      localStorage.setItem('user', JSON.stringify(userDataRes));
      return { success: true, user: userDataRes };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const res = await api.post('/api/auth/verify-email', { email, code });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

