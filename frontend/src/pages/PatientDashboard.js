import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import BookAppointment from '../components/patient/BookAppointment';
import MyAppointments from '../components/patient/MyAppointments';
import MyProfile from '../components/patient/MyProfile';
import MyReports from '../components/patient/MyReports';
import MyPrescriptions from '../components/patient/MyPrescriptions';
import MyPayments from '../components/patient/MyPayments';
import MedicineSchedule from '../components/patient/MedicineSchedule';

const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="navbar">
        <div>
          <h3>HMS - Patient Dashboard</h3>
        </div>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <Link to="/patient/profile">My Profile</Link>
          <Link to="/patient/appointments">My Appointments</Link>
          <Link to="/patient/book-appointment">Book Appointment</Link>
          <Link to="/patient/reports">My Reports</Link>
          <Link to="/patient/prescriptions">My Prescriptions</Link>
          <Link to="/patient/medicine-schedule">Medicine Schedule</Link>
          <Link to="/patient/payments">Payments</Link>
        </div>
        <div className="content-area">
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
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

