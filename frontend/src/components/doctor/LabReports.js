import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../../api';

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (showForm) {
      api.get('/api/doctor/patients').then(res => setPatients(res.data || [])).catch(() => setPatients([]));
    }
  }, [showForm]);

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/doctor/lab-reports');
      setReports(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/doctor/request-lab-test', formData);
      alert('Lab test requested successfully!');
      setShowForm(false);
      setFormData({});
      fetchReports();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request lab test');
    }
  };

  return (
    <div>
      <div className="table-toolbar">
        <h2>Lab Reports</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          Request Lab Test
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Request Lab Test</h3>
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label>Patient *</label>
              <select
                value={formData.patient || ''}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                required
              >
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} – {p.email}</option>
                ))}
              </select>
              {patients.length === 0 && <small className="text-muted">No patients found. Patients appear after they book appointments with you.</small>}
            </div>
            <div className="form-group">
              <label>Test Type</label>
              <input
                type="text"
                value={formData.testType || ''}
                onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Test Name</label>
              <input
                type="text"
                value={formData.testName || ''}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-primary">Request</button>
          </form>
        </div>
      )}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Test Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report._id}>
                <td>{moment(report.createdAt).format('DD/MM/YYYY')}</td>
                <td>{report.patient?.name}</td>
                <td>{report.testName}</td>
                <td>
                  <span className={`status-badge status-${report.status}`}>
                    {report.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabReports;

