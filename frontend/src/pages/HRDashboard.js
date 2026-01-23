import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffManagement from '../components/hr/StaffManagement';
import SalaryManagement from '../components/hr/SalaryManagement';

const HRDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <div className="navbar">
        <div>
          <h3>HMS - HR Dashboard</h3>
        </div>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <Link to="/hr/staff">Staff Management</Link>
          <Link to="/hr/salaries">Salary Management</Link>
        </div>
        <div className="content-area">
          <Routes>
            <Route path="staff" element={<StaffManagement />} />
            <Route path="salaries" element={<SalaryManagement />} />
            <Route path="*" element={<Navigate to="/hr/staff" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

