import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import moment from 'moment';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/patient/reports');
      setReports(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      reports.filter((report) => {
        if (status !== 'all' && report.status !== status) return false;
        const hay = `${report.testName || ''} ${report.testType || ''} ${report.doctor?.name || ''}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      }),
    [reports, query, status]
  );

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>Lab & scan reports</h2>
          <p>Search, filter, and open your latest results.</p>
        </div>
      </div>

      <div className="ph-kpis">
        <div className="ph-kpi"><span>Total reports</span><strong>{reports.length}</strong></div>
        <div className="ph-kpi"><span>Ready</span><strong>{reports.filter((r) => r.status === 'completed' || r.reportFile).length}</strong></div>
        <div className="ph-kpi"><span>Pending</span><strong>{reports.filter((r) => r.status === 'pending').length}</strong></div>
      </div>

      <div className="ph-toolbar">
        <input className="ph-search" placeholder="Search test or doctor" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="card ph-card">
        {filtered.length === 0 ? (
          <div className="ph-empty">No reports found.</div>
        ) : (
          <table className="ph-soft-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Test</th>
                <th>Type</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report._id}>
                  <td>{moment(report.createdAt).format('DD MMM YYYY')}</td>
                  <td>{report.testName}</td>
                  <td>{report.testType}</td>
                  <td>{report.doctor?.name || 'N/A'}</td>
                  <td><span className={`status-badge status-${report.status}`}>{report.status}</span></td>
                  <td>
                    {report.reportFile ? (
                      <a href={`${apiBaseUrl}/${report.reportFile}`} target="_blank" rel="noopener noreferrer">Open</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyReports;
