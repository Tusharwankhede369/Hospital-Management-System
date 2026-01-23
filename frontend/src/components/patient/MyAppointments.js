import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/patient/appointments');
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
        await axios.put(`/api/appointments/${id}/cancel`);
        fetchAppointments();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>My Appointments</h2>
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
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: apt.status === 'completed' ? '#d4edda' : 
                                      apt.status === 'confirmed' ? '#d1ecf1' : 
                                      apt.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                      color: apt.status === 'completed' ? '#155724' : 
                            apt.status === 'confirmed' ? '#0c5460' : 
                            apt.status === 'cancelled' ? '#721c24' : '#856404'
                    }}>
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

