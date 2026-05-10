import React, { useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BookAppointment from '../components/patient/BookAppointment';
import MyAppointments from '../components/patient/MyAppointments';
import MyProfile from '../components/patient/MyProfile';
import MyReports from '../components/patient/MyReports';
import MyPrescriptions from '../components/patient/MyPrescriptions';
import MyPayments from '../components/patient/MyPayments';
import MedicineSchedule from '../components/patient/MedicineSchedule';
import RoleDashboardLayout from '../components/layout/RoleDashboardLayout';
import ChatWidget from '../components/common/ChatWidget';
import '../css/admin-dashboard.css';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navItems = [
    { to: '/patient/profile', label: 'My Profile', icon: '🙍' },
    { to: '/patient/appointments', label: 'My Appointments', icon: '📅' },
    { to: '/patient/book-appointment', label: 'Book Appointment', icon: '➕' },
    { to: '/patient/reports', label: 'My Reports', icon: '🧾' },
    { to: '/patient/prescriptions', label: 'My Prescriptions', icon: '💊' },
    { to: '/patient/medicine-schedule', label: 'Medicine Schedule', icon: '⏰' },
    { to: '/patient/payments', label: 'Payments', icon: '💳' },
  ];

  return (
    <RoleDashboardLayout
      title="Patient Dashboard"
      subtitle="Personal Health Hub"
      userName={user?.name || 'Patient'}
      navItems={navItems}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="profile" element={<MyProfile />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="reports" element={<MyReports />} />
        <Route path="prescriptions" element={<MyPrescriptions />} />
        <Route path="medicine-schedule" element={<MedicineSchedule />} />
        <Route path="payments" element={<MyPayments />} />
        <Route path="*" element={<Navigate to="/patient/profile" />} />
      </Routes>
      <ChatWidget />
    </RoleDashboardLayout>
  );
};

export default PatientDashboard;

