import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import api from '../../api';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', date: '' });

  const fetchAppointments = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.date) params.date = filter.date;
      const res = await api.get('/api/doctor/appointments', { params });
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/doctor/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar">
        <h2>My Appointments</h2>
      </div>
      <div className="card" style={{ marginBottom: '20px', maxWidth: 980 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Status</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Token</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No appointments found</td>
              </tr>
            ) : (
              appointments.map(apt => (
                <tr key={apt._id}>
                  <td>{moment(apt.appointmentDate).format('DD/MM/YYYY')}</td>
                  <td>{apt.timeSlot}</td>
                  <td>{apt.patient?.name}</td>
                  <td>{apt.tokenNumber}</td>
                  <td>
                    <span className={`status-badge status-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    {apt.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => updateStatus(apt._id, 'confirmed')}
                          style={{ padding: '5px 10px', fontSize: '14px', marginRight: '5px' }}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => updateStatus(apt._id, 'cancelled')}
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => updateStatus(apt._id, 'completed')}
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                      >
                        Mark Completed
                      </button>
                    )}
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

export default DoctorAppointments;

