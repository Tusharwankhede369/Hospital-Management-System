import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3>Total Patients</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalPatients || 0}</p>
        </div>
        <div className="card">
          <h3>Total Doctors</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalDoctors || 0}</p>
        </div>
        <div className="card">
          <h3>Total Staff</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalStaff || 0}</p>
        </div>
        <div className="card">
          <h3>Today's Appointments</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.todayAppointments || 0}</p>
        </div>
        <div className="card">
          <h3>Monthly Appointments</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.monthlyAppointments || 0}</p>
        </div>
        <div className="card">
          <h3>Monthly Revenue</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>₹{stats?.monthlyRevenue || 0}</p>
        </div>
      </div>
      {stats?.doctorIncome && stats.doctorIncome.length > 0 && (
        <div className="card">
          <h3>Doctor-wise Income (This Month)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Income</th>
              </tr>
            </thead>
            <tbody>
              {stats.doctorIncome.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.doctorName}</td>
                  <td>₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;

