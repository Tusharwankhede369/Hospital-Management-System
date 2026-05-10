import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PatientEntry from '../components/staff/PatientEntry';
import RoomManagement from '../components/staff/RoomManagement';
import MedicineSchedule from '../components/staff/MedicineSchedule';
import UploadReport from '../components/staff/UploadReport';
import CashPayment from '../components/staff/CashPayment';
import MySalary from '../components/staff/MySalary';
import StaffProfile from '../components/staff/StaffProfile';
import TaskBoard from '../components/staff/TaskBoard';
import RoleDashboardLayout from '../components/layout/RoleDashboardLayout';
import ChatWidget from '../components/common/ChatWidget';
import '../css/admin-dashboard.css';

const StaffDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navItems = [
    { to: '/staff/profile', label: 'My Profile', icon: '👤' },
    ...(user?.staffType === 'receptionist'
      ? [
          { to: '/staff/patient-entry', label: 'Patient Entry', icon: '🧾' },
          { to: '/staff/cash-payment', label: 'Cash Payment', icon: '💵' },
        ]
      : []),
    ...(user?.staffType === 'nurse' ? [{ to: '/staff/medicine-schedule', label: 'Medicine Schedule', icon: '💊' }] : []),
    ...(user?.staffType === 'lab_staff' ? [{ to: '/staff/upload-report', label: 'Upload Report', icon: '📤' }] : []),
    ...(user?.staffType === 'ward_staff' ? [{ to: '/staff/rooms', label: 'Room Management', icon: '🛏️' }] : []),
    { to: '/staff/my-salary', label: 'My Salary', icon: '💰' },
    { to: '/staff/tasks', label: 'Task Board', icon: '✅' },
    { to: '/staff/rooms', label: 'Rooms', icon: '🏥' },
  ];

  return (
    <RoleDashboardLayout
      title="Staff Dashboard"
      subtitle="Operational Workflow"
      userName={user?.name || 'Staff'}
      navItems={navItems}
      onLogout={logout}
    >
      <Routes>
        <Route path="profile" element={<StaffProfile />} />
        <Route path="patient-entry" element={<PatientEntry />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="medicine-schedule" element={<MedicineSchedule />} />
        <Route path="upload-report" element={<UploadReport />} />
        <Route path="cash-payment" element={<CashPayment />} />
        <Route path="my-salary" element={<MySalary />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="*" element={<Navigate to="/staff/profile" />} />
      </Routes>
      <ChatWidget />
    </RoleDashboardLayout>
  );
};

export default StaffDashboard;

