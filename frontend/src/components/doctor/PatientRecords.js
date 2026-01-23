import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await axios.get('/api/doctor/patient-records');
      setRecords(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/doctor/patient-record', {
        ...formData,
        patient: selectedRecord?.patient?._id || formData.patient,
        appointment: selectedRecord?.appointment?._id || formData.appointment
      });
      setMessage('Record saved successfully!');
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save record');
    }
  };

  return (
    <div>
      <h2>Patient Records</h2>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Diagnosis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record._id}>
                <td>{moment(record.createdAt).format('DD/MM/YYYY')}</td>
                <td>{record.patient?.name}</td>
                <td>{record.diagnosis || 'N/A'}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedRecord(record);
                      setFormData({
                        patient: record.patient?._id,
                        appointment: record.appointment?._id,
                        diagnosis: record.diagnosis || '',
                        symptoms: record.symptoms || [],
                        treatmentPlan: record.treatmentPlan || '',
                        prescriptions: record.prescriptions || [],
                        followUpDate: record.followUpDate ? moment(record.followUpDate).format('YYYY-MM-DD') : ''
                      });
                    }}
                  >
                    View/Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRecord && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Edit Patient Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Diagnosis</label>
              <textarea
                value={formData.diagnosis || ''}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Treatment Plan</label>
              <textarea
                value={formData.treatmentPlan || ''}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate || ''}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedRecord(null)}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;

