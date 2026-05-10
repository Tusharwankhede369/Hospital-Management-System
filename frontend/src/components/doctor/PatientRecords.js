import React, { useState, useEffect } from 'react';
import moment from 'moment';
import MedicineAutocomplete from '../MedicineAutocomplete';
import api from '../../api';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (showNewForm) {
      api.get('/api/doctor/patients').then(res => setPatients(res.data || [])).catch(() => setPatients([]));
    }
  }, [showNewForm]);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/api/doctor/patient-records');
      setRecords(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prescriptions = (formData.prescriptions || [])
      .filter(p => p && (p.medicineName || p.dosage))
      .map(p => ({
        medicine: p.medicine || undefined,
        medicineName: p.medicineName || '',
        dosage: p.dosage || '',
        timing: p.timing || 'morning',
        duration: Number(p.duration) || 7
      }));
    try {
      await api.post('/api/doctor/patient-record', {
        patient: selectedRecord?.patient?._id || formData.patient,
        appointment: selectedRecord?.appointment?._id || formData.appointment || undefined,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        treatmentPlan: formData.treatmentPlan,
        prescriptions,
        followUpDate: formData.followUpDate || undefined,
        notes: formData.notes
      });
      setMessage('Record saved successfully!');
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save record');
    }
  };

  const addPrescription = () => {
    const list = Array.isArray(formData.prescriptions) ? [...formData.prescriptions] : [];
    list.push({ medicineName: '', dosage: '', timing: 'morning', duration: 7 });
    setFormData({ ...formData, prescriptions: list });
  };

  const removePrescription = (index) => {
    const list = (formData.prescriptions || []).slice();
    list.splice(index, 1);
    setFormData({ ...formData, prescriptions: list });
  };

  const updatePrescription = (index, field, value) => {
    const list = (formData.prescriptions || []).slice();
    if (!list[index]) list[index] = {};
    list[index] = { ...list[index], [field]: field === 'duration' ? (value ? Number(value) : 0) : value };
    setFormData({ ...formData, prescriptions: list });
  };

  const handleMedicineSelect = (index, medicine) => {
    const list = (formData.prescriptions || []).slice();
    if (!list[index]) list[index] = {};
    list[index] = { ...list[index], medicineName: medicine.name, medicine: medicine._id };
    setFormData({ ...formData, prescriptions: list });
  };

  const handleNewRecord = async (e) => {
    e.preventDefault();
    if (!formData.patient) {
      setMessage('Please select a patient');
      return;
    }
    const prescriptions = (formData.prescriptions || [])
      .filter(p => p && (p.medicineName || p.dosage))
      .map(p => ({
        medicine: p.medicine || undefined,
        medicineName: p.medicineName || '',
        dosage: p.dosage || '',
        timing: p.timing || 'morning',
        duration: Number(p.duration) || 7
      }));
    try {
      await api.post('/api/doctor/patient-record', {
        patient: formData.patient,
        appointment: formData.appointment || undefined,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        treatmentPlan: formData.treatmentPlan,
        prescriptions,
        followUpDate: formData.followUpDate || undefined
      });
      setMessage('Record saved successfully!');
      setShowNewForm(false);
      setFormData({});
      fetchRecords();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save record');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Patient Records & Prescriptions</h2>
        <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? 'Cancel' : 'New Record / Prescription'}
        </button>
      </div>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      {showNewForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create Patient Record / Prescription</h3>
          <form onSubmit={handleNewRecord}>
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
            </div>
            <div className="form-group">
              <label>Diagnosis</label>
              <textarea value={formData.diagnosis || ''} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} rows="2" />
            </div>
            <div className="form-group">
              <label>Treatment Plan</label>
              <textarea value={formData.treatmentPlan || ''} onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })} rows="2" />
            </div>
            <div className="form-group">
              <label>Prescriptions</label>
              <div style={{ marginBottom: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={addPrescription}>
                  + Add medicine
                </button>
              </div>
              {(formData.prescriptions || []).length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Click &quot;Add medicine&quot; to add prescription items.</p>
              ) : (
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', marginBottom: '10px' }}>
                  {(formData.prescriptions || []).map((p, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px auto', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
                      <div>
                        <MedicineAutocomplete
                          value={p.medicineName || ''}
                          onChange={(val) => updatePrescription(idx, 'medicineName', val)}
                          onSelect={(med) => handleMedicineSelect(idx, med)}
                          placeholder="Search medicine (e.g. Paracetamol)"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={p.dosage || ''}
                        onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)}
                      />
                      <select
                        value={p.timing || 'morning'}
                        onChange={(e) => updatePrescription(idx, 'timing', e.target.value)}
                      >
                        <option value="morning">Morning</option>
                        <option value="before_breakfast">Before breakfast</option>
                        <option value="after_breakfast">After breakfast</option>
                        <option value="before_lunch">Before lunch</option>
                        <option value="after_lunch">After lunch</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="before_dinner">Before dinner</option>
                        <option value="after_dinner">After dinner</option>
                        <option value="night">Night</option>
                        <option value="before_food">Before food</option>
                        <option value="after_food">After food</option>
                        <option value="all">All (morning, afternoon, night)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Days"
                        min="1"
                        value={p.duration || ''}
                        onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" onClick={() => removePrescription(idx)} style={{ padding: '6px 10px' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input type="date" value={formData.followUpDate || ''} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Save Record</button>
          </form>
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
                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <button
                      className="btn btn-success"
                      style={{ marginLeft: '8px' }}
                      onClick={async () => {
                        try {
                          await api.post('/api/medicines/schedule', {
                            patientRecordId: record._id,
                            prescriptions: record.prescriptions.map(p => ({
                              medicine: p.medicine,
                              medicineName: p.medicineName,
                              dosage: p.dosage,
                              timing: p.timing || 'morning',
                              duration: p.duration || 7
                            }))
                          });
                          setMessage('Medicine schedule created. Patient and nurses can see it.');
                        } catch (err) {
                          setMessage(err.response?.data?.message || 'Failed to create schedule');
                        }
                      }}
                    >
                      Create medicine schedule
                    </button>
                  )}
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
              <label>Prescriptions</label>
              <div style={{ marginBottom: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={addPrescription}>
                  + Add medicine
                </button>
              </div>
              {(formData.prescriptions || []).length > 0 && (
                <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', marginBottom: '10px' }}>
                  {(formData.prescriptions || []).map((p, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px auto', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
                      <div>
                        <MedicineAutocomplete
                          value={p.medicineName || ''}
                          onChange={(val) => updatePrescription(idx, 'medicineName', val)}
                          onSelect={(med) => handleMedicineSelect(idx, med)}
                          placeholder="Search medicine (e.g. Paracetamol)"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={p.dosage || ''}
                        onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)}
                      />
                      <select
                        value={p.timing || 'morning'}
                        onChange={(e) => updatePrescription(idx, 'timing', e.target.value)}
                      >
                        <option value="morning">Morning</option>
                        <option value="before_breakfast">Before breakfast</option>
                        <option value="after_breakfast">After breakfast</option>
                        <option value="before_lunch">Before lunch</option>
                        <option value="after_lunch">After lunch</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="before_dinner">Before dinner</option>
                        <option value="after_dinner">After dinner</option>
                        <option value="night">Night</option>
                        <option value="before_food">Before food</option>
                        <option value="after_food">After food</option>
                        <option value="all">All (morning, afternoon, night)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Days"
                        min="1"
                        value={p.duration || ''}
                        onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" onClick={() => removePrescription(idx)} style={{ padding: '6px 10px' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

