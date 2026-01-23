import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/admin/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Appointment Management</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(apt => (
              <tr key={apt._id}>
                <td>{moment(apt.appointmentDate).format('DD/MM/YYYY')}</td>
                <td>{apt.timeSlot}</td>
                <td>{apt.patient?.name}</td>
                <td>{apt.doctor?.name}</td>
                <td>{apt.department}</td>
                <td>{apt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentManagement;

