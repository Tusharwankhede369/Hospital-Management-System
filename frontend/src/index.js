import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Ensure API requests reach the backend in both dev + production.
// This lets existing axios calls like `axios.get('/api/...')` work after deployment.
const apiBaseURL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

axios.defaults.baseURL = apiBaseURL;

// Attach JWT token (if present) for protected API routes.
// This ensures even components using raw `axios` send Authorization header after refresh/deploy.
try {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
} catch {
  // ignore storage errors (private mode, blocked storage, etc.)
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

