import React, { useState, useEffect } from 'react';
import api from '../../api';
import moment from 'moment';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/api/patient/prescriptions');
      setPrescriptions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>My Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <div className="card">
          <p>No prescriptions found</p>
        </div>
      ) : (
        prescriptions.map(pres => (
          <div key={pres._id} className="card">
            <h3>Prescription by Dr. {pres.doctor?.name}</h3>
            <p><strong>Date:</strong> {moment(pres.createdAt).format('DD/MM/YYYY')}</p>
            {pres.diagnosis && <p><strong>Diagnosis:</strong> {pres.diagnosis}</p>}
            {pres.symptoms && pres.symptoms.length > 0 && (
              <p><strong>Symptoms:</strong> {pres.symptoms.join(', ')}</p>
            )}
            {pres.treatmentPlan && <p><strong>Treatment Plan:</strong> {pres.treatmentPlan}</p>}
            {pres.prescriptions && pres.prescriptions.length > 0 && (
              <div>
                <h4>Medicines:</h4>
                <ul>
                  {pres.prescriptions.map((med, idx) => (
                    <li key={idx}>
                      {med.medicineName} - {med.dosage} - {med.timing} - {med.duration} days
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pres.followUpDate && (
              <p><strong>Follow-up Date:</strong> {moment(pres.followUpDate).format('DD/MM/YYYY')}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyPrescriptions;

