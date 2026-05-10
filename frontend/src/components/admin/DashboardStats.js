import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="kpi-grid">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="kpi-card">
            <h4>Loading...</h4>
            <p className="kpi-value">--</p>
          </div>
        ))}
      </div>
    );
  }

  const kpiItems = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: '🧑‍⚕️', trend: '+12% this month' },
    { label: 'Today Appointments', value: stats?.todayAppointments || 0, icon: '📅', trend: '+4% vs yesterday' },
    { label: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: '💰', trend: '+18% this month' },
    { label: 'Pending Salaries', value: stats?.pendingSalaries || 0, icon: '💼', trend: 'Needs approval' },
    { label: 'Occupied Rooms', value: stats?.occupiedRooms || 0, icon: '🛏️', trend: 'Current occupancy' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: '🧪', trend: 'Review queue' },
  ];

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2>Overview</h2>
            <p style={{ color: 'var(--muted)', marginTop: 4 }}>Performance snapshot for hospital operations.</p>
          </div>
          <div className="quick-actions">
            <Link to="/admin/users" className="btn btn-primary">+ Create User</Link>
            <Link to="/admin/rooms" className="btn btn-secondary">+ Add Room</Link>
            <Link to="/admin/medicines" className="btn btn-secondary">+ Add Medicine</Link>
            <Link to="/admin/report-analyzer" className="btn btn-success">Analyze Report</Link>
            <Link to="/admin/payments" className="btn btn-primary">View Payments</Link>
          </div>
        </div>

        <div className="kpi-grid">
          {kpiItems.map((item) => (
            <div className="kpi-card" key={item.label}>
              <h4>{item.icon} {item.label}</h4>
              <div className="kpi-value">{item.value}</div>
              <div className="kpi-meta">{item.trend}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <h3>Revenue by Month</h3>
          <svg className="line-chart" viewBox="0 0 600 240" preserveAspectRatio="none">
            <polyline points="10,190 60,172 110,165 160,145 210,120 260,105 310,118 360,96 410,80 460,74 510,60 580,48" />
            {[10, 60, 110, 160, 210, 260, 310, 360, 410, 460, 510, 580].map((x, idx) => {
              const y = [190, 172, 165, 145, 120, 105, 118, 96, 80, 74, 60, 48][idx];
              return <circle key={x} cx={x} cy={y} r="4" />;
            })}
          </svg>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Steady month-on-month growth with small dip in Q3.</p>
        </div>
        <div className="chart-box">
          <h3>Payment Status</h3>
          <div className="donut-wrap">
            <div className="donut-chart">
              <div className="donut-center-text">68%</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <p><span style={{ color: '#16a34a' }}>●</span> Paid 68%</p>
            <p><span style={{ color: '#eab308' }}>●</span> Pending 22%</p>
            <p><span style={{ color: '#ef4444' }}>●</span> Failed 10%</p>
          </div>
        </div>
      </div>

      {stats?.doctorIncome?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Doctor-wise Income</h3>
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

