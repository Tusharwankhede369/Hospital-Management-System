import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (apt) => {
    const id = apt?._id ?? apt;
    if (!id) return;
    const idStr = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    if (!window.confirm('Are you sure you want to delete this booking? This cannot be undone.')) return;
    setDeletingId(idStr);
    try {
      await axios.delete(`/api/admin/appointments/${idStr}`);
      setAppointments(prev => prev.filter(a => String(a._id) !== idStr));
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Failed to delete appointment';
      alert(msg);
    } finally {
      setDeletingId(null);
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
              <th>Actions</th>
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
                <td>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(apt)}
                    disabled={deletingId === String(apt._id)}
                  >
                    {deletingId === String(apt._id) ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentManagement;

