import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import moment from 'moment';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/api/patient/prescriptions');
      setPrescriptions(res.data);
      if (res.data[0]) setOpenId(res.data[0]._id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      prescriptions.filter((pres) => {
        const meds = (pres.prescriptions || []).map((m) => m.medicineName).join(' ');
        return `${pres.doctor?.name || ''} ${pres.diagnosis || ''} ${meds}`.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [prescriptions, query]
  );

  const printCard = (pres) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const meds = (pres.prescriptions || [])
      .map((med) => `<li>${med.medicineName} — ${med.dosage} — ${med.timing} — ${med.duration} days</li>`)
      .join('');
    win.document.write(`
      <html><head><title>Prescription</title></head>
      <body style="font-family:Segoe UI,sans-serif;padding:24px">
        <h2>Prescription by Dr. ${pres.doctor?.name || ''}</h2>
        <p>Date: ${moment(pres.createdAt).format('DD MMM YYYY')}</p>
        ${pres.diagnosis ? `<p>Diagnosis: ${pres.diagnosis}</p>` : ''}
        <ul>${meds}</ul>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="loading">Loading prescriptions...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>My prescriptions</h2>
          <p>Expand a visit, review medicines, and print a copy.</p>
        </div>
      </div>

      <div className="ph-toolbar">
        <input className="ph-search" placeholder="Search diagnosis or medicine" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card ph-card ph-empty">No prescriptions found.</div>
      ) : (
        filtered.map((pres) => (
          <div key={pres._id} className="card ph-card ph-pres-card">
            <button className="ph-pres-head" type="button" onClick={() => setOpenId(openId === pres._id ? null : pres._id)}>
              <div>
                <h3>Dr. {pres.doctor?.name}</h3>
                <p>{moment(pres.createdAt).format('DD MMM YYYY')} · {pres.diagnosis || 'Consultation'}</p>
              </div>
              <span className="ph-pill">{openId === pres._id ? 'Hide' : 'View'}</span>
            </button>
            {openId === pres._id && (
              <div style={{ marginTop: 12 }}>
                {pres.symptoms?.length > 0 && <p><strong>Symptoms:</strong> {pres.symptoms.join(', ')}</p>}
                {pres.treatmentPlan && <p><strong>Treatment:</strong> {pres.treatmentPlan}</p>}
                {(pres.prescriptions || []).length > 0 && (
                  <div className="ph-timeline" style={{ marginTop: 10 }}>
                    {pres.prescriptions.map((med, idx) => (
                      <div className="ph-dose" key={`${pres._id}-${idx}`}>
                        <div>
                          <strong>{med.medicineName}</strong>
                          <p>{med.dosage} · {med.timing}</p>
                        </div>
                        <span className="ph-pill">{med.duration} days</span>
                      </div>
                    ))}
                  </div>
                )}
                {pres.followUpDate && (
                  <p style={{ marginTop: 10 }}><strong>Follow-up:</strong> {moment(pres.followUpDate).format('DD MMM YYYY')}</p>
                )}
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => printCard(pres)}>Print</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyPrescriptions;
