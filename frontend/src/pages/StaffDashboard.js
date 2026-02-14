import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PatientEntry from '../components/staff/PatientEntry';
import RoomManagement from '../components/staff/RoomManagement';
import MedicineSchedule from '../components/staff/MedicineSchedule';
import UploadReport from '../components/staff/UploadReport';
import CashPayment from '../components/staff/CashPayment';
import MySalary from '../components/staff/MySalary';

const StaffDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <div className="navbar">
        <div>
          <h3>HMS - Staff Dashboard</h3>
        </div>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          {user?.staffType === 'receptionist' && (
            <>
              <Link to="/staff/patient-entry">Patient Entry</Link>
              <Link to="/staff/cash-payment">Cash Payment</Link>
            </>
          )}
          {user?.staffType === 'nurse' && (
            <Link to="/staff/medicine-schedule">Medicine Schedule</Link>
          )}
          {user?.staffType === 'lab_staff' && (
            <Link to="/staff/upload-report">Upload Report</Link>
          )}
          {user?.staffType === 'ward_staff' && (
            <Link to="/staff/rooms">Room Management</Link>
          )}
          <Link to="/staff/rooms">Rooms</Link>
        </div>
        <div className="content-area">
          <Routes>
            <Route path="patient-entry" element={<PatientEntry />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="medicine-schedule" element={<MedicineSchedule />} />
            <Route path="upload-report" element={<UploadReport />} />
            <Route path="cash-payment" element={<CashPayment />} />
            <Route path="my-salary" element={<MySalary />} />
            <Route path="*" element={<Navigate to="/staff/rooms" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

