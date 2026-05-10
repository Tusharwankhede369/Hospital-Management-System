import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';

const PayrollOps = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/api/hr/salaries');
        setRows(res.data || []);
      } catch (_) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending').length;
    const approved = rows.filter((r) => r.status === 'approved').length;
    const paid = rows.filter((r) => r.status === 'paid').length;
    return { pending, approved, paid };
  }, [rows]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar"><h2>Payroll Operations</h2></div>
      <div className="kpi-grid" style={{ marginBottom: 12 }}>
        <div className="kpi-card"><h4>Pending</h4><div className="kpi-value">{stats.pending}</div></div>
        <div className="kpi-card"><h4>Approved</h4><div className="kpi-value">{stats.approved}</div></div>
        <div className="kpi-card"><h4>Paid</h4><div className="kpi-value">{stats.paid}</div></div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Employee</th><th>Month/Year</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.employee?.name || '-'}</td>
                <td>{r.month}/{r.year}</td>
                <td>₹{r.totalAmount || 0}</td>
                <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollOps;
