import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffManagement from '../components/hr/StaffManagement';
import SalaryManagement from '../components/hr/SalaryManagement';
import HRProfile from '../components/hr/HRProfile';
import HiringPipeline from '../components/hr/HiringPipeline';
import PayrollOps from '../components/hr/PayrollOps';
import RoleDashboardLayout from '../components/layout/RoleDashboardLayout';
import ChatWidget from '../components/common/ChatWidget';
import '../css/admin-dashboard.css';

const HRDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navItems = [
    { to: '/hr/profile', label: 'My Profile', icon: '👤' },
    { to: '/hr/staff', label: 'Staff Management', icon: '👥' },
    { to: '/hr/salaries', label: 'Salary Management', icon: '💼' },
    { to: '/hr/hiring', label: 'Hiring Pipeline', icon: '📌' },
    { to: '/hr/payroll', label: 'Payroll Ops', icon: '💳' },
  ];

  return (
    <RoleDashboardLayout
      title="HR Dashboard"
      subtitle="People Operations"
      userName={user?.name || 'HR'}
      navItems={navItems}
      onLogout={logout}
    >
      <Routes>
        <Route path="profile" element={<HRProfile />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="salaries" element={<SalaryManagement />} />
        <Route path="hiring" element={<HiringPipeline />} />
        <Route path="payroll" element={<PayrollOps />} />
        <Route path="*" element={<Navigate to="/hr/profile" />} />
      </Routes>
      <ChatWidget />
    </RoleDashboardLayout>
  );
};

export default HRDashboard;

