import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/doctor/lab-reports');
      setReports(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/doctor/request-lab-test', formData);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              <label>Patient ID</label>
              <input
                type="text"
                value={formData.patient || ''}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                required
              />
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
                <td>{report.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabReports;

