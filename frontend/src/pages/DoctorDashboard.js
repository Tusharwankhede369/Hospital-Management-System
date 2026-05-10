import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DoctorProfile from '../components/doctor/DoctorProfile';
import DoctorAppointments from '../components/doctor/DoctorAppointments';
import PatientRecords from '../components/doctor/PatientRecords';
import LabReports from '../components/doctor/LabReports';
import ReportAnalyzer from '../components/common/ReportAnalyzer';
import ChatWidget from '../components/common/ChatWidget';
import RoleDashboardLayout from '../components/layout/RoleDashboardLayout';
import '../css/admin-dashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navItems = [
    { to: '/doctor/profile', label: 'My Profile', icon: '👨‍⚕️' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
    { to: '/doctor/patient-records', label: 'Patient Records', icon: '📁' },
    { to: '/doctor/lab-reports', label: 'Lab Reports', icon: '🧪' },
    { to: '/doctor/report-analyzer', label: 'Report Analyzer', icon: '📊' },
  ];

  return (
    <RoleDashboardLayout
      title="Doctor Dashboard"
      subtitle="Clinical Workspace"
      userName={`Dr. ${user?.name || 'Doctor'}`}
      navItems={navItems}
      onLogout={logout}
    >
      <Routes>
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patient-records" element={<PatientRecords />} />
        <Route path="lab-reports" element={<LabReports />} />
        <Route path="report-analyzer" element={<ReportAnalyzer />} />
        <Route path="*" element={<Navigate to="/doctor/appointments" />} />
      </Routes>
      <ChatWidget />
    </RoleDashboardLayout>
  );
};

export default DoctorDashboard;

