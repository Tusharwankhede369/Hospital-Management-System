import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DoctorProfile from '../components/doctor/DoctorProfile';
import DoctorAppointments from '../components/doctor/DoctorAppointments';
import PatientRecords from '../components/doctor/PatientRecords';
import LabReports from '../components/doctor/LabReports';

const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <div className="navbar">
        <div>
          <h3>HMS - Doctor Dashboard</h3>
        </div>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, Dr. {user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <Link to="/doctor/profile">My Profile</Link>
          <Link to="/doctor/appointments">Appointments</Link>
          <Link to="/doctor/patient-records">Patient Records</Link>
          <Link to="/doctor/lab-reports">Lab Reports</Link>
        </div>
        <div className="content-area">
          <Routes>
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patient-records" element={<PatientRecords />} />
            <Route path="lab-reports" element={<LabReports />} />
            <Route path="*" element={<Navigate to="/doctor/appointments" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

