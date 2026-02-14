import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadReport = () => {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient: '',
    testType: '',
    testName: '',
    testResults: '',
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/staff/patients').then(res => setPatients(res.data || [])).catch(() => setPatients([]));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (file) {
      data.append('reportFile', file);
    }

    try {
      await axios.post('/api/staff/upload-report', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Report uploaded successfully!');
      setFormData({ patient: '', testType: '', testName: '', testResults: '', notes: '' });
      setFile(null);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to upload report');
    }
  };

  return (
    <div>
      <h2>Upload Lab Report</h2>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Patient *</label>
          <select name="patient" value={formData.patient} onChange={handleChange} required>
            <option value="">Select patient...</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>{p.name} – {p.email}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Test Type *</label>
          <input type="text" name="testType" value={formData.testType} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Test Name *</label>
          <input type="text" name="testName" value={formData.testName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Test Results</label>
          <textarea name="testResults" value={formData.testResults} onChange={handleChange} rows="5" />
        </div>
        <div className="form-group">
          <label>Report File (PDF/Image)</label>
          <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
        </div>
        <button type="submit" className="btn btn-primary">Upload Report</button>
      </form>
    </div>
  );
};

export default UploadReport;

