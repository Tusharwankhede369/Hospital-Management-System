import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/admin/DashboardStats';
import UserManagement from '../components/admin/UserManagement';
import AppointmentManagement from '../components/admin/AppointmentManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import RoomManagement from '../components/admin/RoomManagement';
import MedicineManagement from '../components/admin/MedicineManagement';
import SalaryApproval from '../components/admin/SalaryApproval';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <div className="navbar">
        <div>
          <h3>HMS - Admin Dashboard</h3>
        </div>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/users">User Management</Link>
          <Link to="/admin/appointments">Appointments</Link>
          <Link to="/admin/payments">Payments</Link>
          <Link to="/admin/rooms">Room Management</Link>
          <Link to="/admin/medicines">Medicine Management</Link>
          <Link to="/admin/salaries">Salary Approval</Link>
        </div>
        <div className="content-area">
          <Routes>
            <Route path="dashboard" element={<DashboardStats />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="medicines" element={<MedicineManagement />} />
            <Route path="salaries" element={<SalaryApproval />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

