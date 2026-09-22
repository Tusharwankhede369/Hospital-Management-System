import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import api from '../../api';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState('');

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
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/api/appointments/${id}/cancel`);
      setToast('Appointment cancelled');
      fetchAppointments();
    } catch (error) {
      setToast(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const filtered = useMemo(() => {
    const now = moment().startOf('day');
    return appointments.filter((apt) => {
      const date = moment(apt.appointmentDate);
      const isUpcoming = ['pending', 'confirmed'].includes(apt.status) && date.isSameOrAfter(now);
      if (tab === 'upcoming' && !isUpcoming) return false;
      if (tab === 'past' && isUpcoming) return false;
      if (status !== 'all' && apt.status !== status) return false;
      const hay = `${apt.doctor?.name || ''} ${apt.department || ''} ${apt.tokenNumber || ''}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [appointments, tab, query, status]);

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>My appointments</h2>
          <p>Track visits, tokens, and upcoming care in one place.</p>
        </div>
        <Link to="/patient/book-appointment" className="btn btn-primary">New booking</Link>
      </div>

      <div className="ph-toolbar">
        {['upcoming', 'past', 'all'].map((item) => (
          <button key={item} className={`ph-chip ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
        <input className="ph-search" placeholder="Search doctor or department" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card ph-card">
        {filtered.length === 0 ? (
          <div className="ph-empty">No appointments in this view.</div>
        ) : (
          <table className="ph-soft-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Status</th>
                <th>Token</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt._id}>
                  <td>
                    <strong>{moment(apt.appointmentDate).format('DD MMM YYYY')}</strong>
                    <div>{apt.timeSlot}</div>
                  </td>
                  <td>{apt.doctor?.name}</td>
                  <td>{apt.department}</td>
                  <td><span className={`status-badge status-${apt.status}`}>{apt.status}</span></td>
                  <td>{apt.tokenNumber || '—'}</td>
                  <td>
                    {apt.status === 'pending' || apt.status === 'confirmed' ? (
                      <button className="btn btn-danger" onClick={() => handleCancel(apt._id)}>Cancel</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
};

export default MyAppointments;
