import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../../api';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/api/patient/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.put(`/api/appointments/${id}/cancel`);
        fetchAppointments();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar"><h2>My Appointments</h2></div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Status</th>
              <th>Token</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No appointments found</td>
              </tr>
            ) : (
              appointments.map(apt => (
                <tr key={apt._id}>
                  <td>{moment(apt.appointmentDate).format('DD/MM/YYYY')}</td>
                  <td>{apt.timeSlot}</td>
                  <td>{apt.doctor?.name}</td>
                  <td>{apt.department}</td>
                  <td>
                    <span className={`status-badge status-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>{apt.tokenNumber}</td>
                  <td>
                    {apt.status === 'pending' || apt.status === 'confirmed' ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancel(apt._id)}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyAppointments;

