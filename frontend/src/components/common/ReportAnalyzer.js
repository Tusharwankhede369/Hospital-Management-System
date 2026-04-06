import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

// Reference ranges for UI display (should match backend logic as closely as possible)
const NORMAL_RANGE_TEXT = {
  Hemoglobin: '12–16 g/dL',
  RBC: '4.0–5.5 million/µL',
  WBC: '4000–11000 /µL',
  Platelets: '150000–450000 /µL',
  'Glucose (Fasting)': '70–100 mg/dL',
  'Glucose (Random)': '70–140 mg/dL',
  'Total Cholesterol': '< 200 mg/dL',
  Creatinine: '0.6–1.3 mg/dL',
  'Uric Acid': '3.5–7.2 mg/dL',
  'Total Bilirubin': '0.3–1.2 mg/dL',
  'Vitamin D': '20–50 ng/mL',
  'Systolic BP': '90–120 mmHg',
  'Diastolic BP': '60–80 mmHg'
};

const ReportAnalyzer = () => {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patient: '',
    testType: '',
    testName: '',
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Wait until user is loaded and authenticated before fetching
    if (!user) return;

    api
      .get('/api/reports/patients')
      .then(res => setPatients(res.data || []))
      .catch(() => setPatients([]));
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResult(null);

    if (!file) {
      setMessage('Please select a PDF report file to analyze.');
      return;
    }

    const data = new FormData();
    if (formData.patient) data.append('patient', formData.patient);
    if (formData.testType) data.append('testType', formData.testType);
    if (formData.testName) data.append('testName', formData.testName);
    if (formData.notes) data.append('notes', formData.notes);
    data.append('file', file);

    setLoading(true);
    try {
      const res = await api.post('/api/reports/analyze', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({
        patient: res.data?.patient || null,
        analysis: Array.isArray(res.data?.analysis) ? res.data.analysis : [],
        insights: res.data?.insights || { conditions: [] }
      });
      setMessage('Report analyzed successfully.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to analyze report';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'normal') return '#1a7f37'; // green
    if (status === 'low' || status === 'high') return '#c62828'; // red
    return '#555';
  };

  const normalizeKey = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

  const findByAliases = (aliases) => {
    if (!result || !Array.isArray(result.analysis)) return null;
    const aliasKeys = aliases.map(normalizeKey);
    return (
      result.analysis.find((a) => aliasKeys.includes(normalizeKey(a.parameter))) ||
      // fallback: contains match (helps when OCR adds extra words)
      result.analysis.find((a) => aliasKeys.some((k) => normalizeKey(a.parameter).includes(k))) ||
      null
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a0d',
        padding: '24px 32px'
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Lab Report Dashboard</h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Analyze patient reports, track key vitals and highlight what needs attention.
            </p>
          </div>
        </div>

      {message && (
        <div className={`alert ${message.toLowerCase().includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          marginBottom: 20,
          padding: '18px 20px',
          borderRadius: 18,
          background: '#ffffff',
          boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
        }}
      >
        <div className="form-group">
          <label>Patient (optional, for saving)</label>
          <select name="patient" value={formData.patient} onChange={handleChange}>
            <option value="">Select patient...</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>
                {p.name} – {p.email}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Test Type (optional, e.g. Blood, Urine)</label>
          <input
            type="text"
            name="testType"
            value={formData.testType}
            onChange={handleChange}
            placeholder="e.g. Blood"
          />
        </div>
        <div className="form-group">
          <label>Test Name (optional, e.g. CBC, LFT)</label>
          <input
            type="text"
            name="testName"
            value={formData.testName}
            onChange={handleChange}
            placeholder="e.g. CBC"
          />
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            placeholder="Any additional notes about this report"
          />
        </div>
        <div className="form-group">
          <label>Report File (PDF only)</label>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Report'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 8 }}>
          {/* Patient details + Conditions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 2fr)',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <div
              className="card"
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: '#ffffff',
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
              }}
            >
              <h3>Patient Details</h3>
              {result.patient ? (
                <div style={{ fontSize: '13px', color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
                  <div><b>Name:</b> {result.patient.name}</div>
                  <div><b>Email:</b> {result.patient.email}</div>
                  {result.patient.phone ? <div><b>Phone:</b> {result.patient.phone}</div> : null}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: 8 }}>
                  Select a patient above to show patient details here.
                </p>
              )}
            </div>

            <div
              className="card"
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: '#ffffff',
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
              }}
            >
              <h3>Possible Conditions & What To Do</h3>
              {(() => {
                const conditions = Array.isArray(result.insights?.conditions) ? result.insights.conditions : [];
                if (conditions.length === 0) {
                  return (
                    <p style={{ fontSize: '13px', color: '#16a34a', marginTop: 8 }}>
                      No major issues detected from extracted parameters.
                    </p>
                  );
                }

                const severityColor = (sev) =>
                  sev === 'high' ? '#dc2626' : sev === 'moderate' ? '#ca8a04' : '#2563eb';

                return conditions.map((c, idx) => (
                  <div key={idx} style={{ marginTop: idx === 0 ? 8 : 14 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {c.name}{' '}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: severityColor(c.severity), textTransform: 'uppercase' }}>
                        {c.severity || 'low'}
                      </span>
                    </div>
                    {Array.isArray(c.evidence) && c.evidence.length > 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                        Evidence: {c.evidence.join('; ')}
                      </div>
                    ) : null}
                    {Array.isArray(c.advice) && c.advice.length > 0 ? (
                      <ul style={{ fontSize: '12px', color: '#475569', marginTop: 6, paddingLeft: 18 }}>
                        {c.advice.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Top-summary dashboard cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            {(() => {
              const total = (result.analysis || []).length;
              const normal = (result.analysis || []).filter(a => a.status === 'normal').length;
              const abnormal = total - normal;
              const healthScore = total ? Math.round((normal / total) * 100) : 0;
              const riskLevel =
                healthScore >= 85 ? 'Low' : healthScore >= 65 ? 'Moderate' : 'High';

              return (
                <>
                  <div
                    className="card"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 18,
                      background: '#ffffff',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Health Score</div>
                    <div style={{ fontSize: '26px', fontWeight: 600, marginTop: 4 }}>
                      {healthScore}/100
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        marginTop: 4,
                        color: riskLevel === 'Low' ? '#16a34a' : riskLevel === 'Moderate' ? '#ca8a04' : '#dc2626'
                      }}
                    >
                      Risk Level: {riskLevel}
                    </div>
                  </div>
                  <div
                    className="card"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 18,
                      background: '#ffffff',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total Tests</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginTop: 4 }}>{total}</div>
                  </div>
                  <div
                    className="card"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 18,
                      background: '#ffffff',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Normal Tests</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginTop: 4, color: '#16a34a' }}>
                      {normal}
                    </div>
                  </div>
                  <div
                    className="card"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 18,
                      background: '#ffffff',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Abnormal Tests</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginTop: 4, color: '#dc2626' }}>
                      {abnormal}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Vitals-style cards row (like the sample dashboard) */}
          <div
            className="card"
            style={{
              marginBottom: '20px',
              padding: '16px 18px',
              borderRadius: 18,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
            }}
          >
            <h3 style={{ marginBottom: '10px' }}>Key Vitals from Report</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}
            >
              {(() => {
                const hemo = findByAliases(['Hemoglobin', 'Hb', 'HGB']);
                const glucose = findByAliases(['Glucose (Fasting)', 'Glucose (Random)', 'Glucose', 'Blood Glucose']);
                const chol = findByAliases(['Total Cholesterol', 'Cholesterol']);
                const sys = findByAliases(['Systolic BP', 'Systolic', 'BP Systolic']);
                const dia = findByAliases(['Diastolic BP', 'Diastolic', 'BP Diastolic']);

                const bpStatus =
                  (sys?.status === 'high' || sys?.status === 'low' || dia?.status === 'high' || dia?.status === 'low')
                    ? 'high'
                    : (sys || dia)
                      ? 'normal'
                      : null;
                const bpColor = bpStatus ? getStatusColor(bpStatus) : '#555';
                const bpValue =
                  (sys || dia)
                    ? `${sys?.value ?? '--'}/${dia?.value ?? '--'} mmHg`
                    : '--';

                const cards = [
                  {
                    label: 'Hemoglobin',
                    item: hemo,
                    rangeText: NORMAL_RANGE_TEXT.Hemoglobin || ''
                  },
                  {
                    label: glucose?.parameter || 'Glucose',
                    item: glucose,
                    rangeText: NORMAL_RANGE_TEXT[glucose?.parameter] || NORMAL_RANGE_TEXT['Glucose (Fasting)'] || ''
                  },
                  {
                    label: chol?.parameter || 'Total Cholesterol',
                    item: chol,
                    rangeText: NORMAL_RANGE_TEXT[chol?.parameter] || NORMAL_RANGE_TEXT['Total Cholesterol'] || ''
                  },
                  {
                    label: 'Blood Pressure',
                    customValue: bpValue,
                    customStatus: bpStatus,
                    rangeText: '90–120 / 60–80 mmHg'
                  }
                ];

                // If OCR didn't match the key vitals but we have analysis, show first 4 parameters as fallback
                const hasAny = cards.some(c => c.item) || bpStatus;
                const fallback = (!hasAny && Array.isArray(result.analysis) && result.analysis.length > 0)
                  ? result.analysis.slice(0, 4).map(a => ({
                      label: a.parameter,
                      item: a,
                      rangeText: NORMAL_RANGE_TEXT[a.parameter] || ''
                    }))
                  : null;

                const toRender = fallback || cards;

                return toRender.map((c) => {
                  const item = c.item || null;
                  const status = c.customStatus || item?.status || null;
                  const color = status ? getStatusColor(status) : '#555';
                  const valueText =
                    c.customValue ||
                    (item ? `${item.value}${item.unit ? ' ' + item.unit : ''}` : '--');

                  return (
                    <div
                      key={c.label}
                      style={{
                        borderRadius: '12px',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{c.label}</div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: '20px',
                          fontWeight: 600,
                          color
                        }}
                      >
                        {valueText}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                        {c.rangeText || ''}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: '11px',
                          color: c.label === 'Blood Pressure' ? bpColor : color,
                          textTransform: 'uppercase'
                        }}
                      >
                        {status ? status : 'NO DATA'}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Health summary + smart suggestions row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 3fr',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <div
              className="card"
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: '#ffffff',
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
              }}
            >
              <h3>Health Summary</h3>
              {(() => {
                const total = (result.analysis || []).length;
                const normal = (result.analysis || []).filter(a => a.status === 'normal').length;
                const abnormal = total - normal;
                return (
                  <ul style={{ fontSize: '13px', color: '#475569', marginTop: 8, paddingLeft: 18 }}>
                    <li>Total tests in this report: {total}</li>
                    <li style={{ color: '#16a34a' }}>Normal tests: {normal}</li>
                    <li style={{ color: '#dc2626' }}>Abnormal tests: {abnormal}</li>
                    {abnormal > 0 && (
                      <li>
                        Key concern:{' '}
                        {(result.analysis || [])
                          .filter(a => a.status !== 'normal')
                          .map(a => a.parameter)
                          .slice(0, 3)
                          .join(', ')}
                      </li>
                    )}
                  </ul>
                );
              })()}
            </div>

            <div
              className="card"
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: '#ffffff',
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
              }}
            >
              <h3>Smart Suggestions</h3>
              {(() => {
                const abnormal = (result.analysis || []).filter(a => a.status !== 'normal');
                if (abnormal.length === 0) {
                  return <p style={{ fontSize: '13px', color: '#22c55e', marginTop: 8 }}>All parameters are within normal range.</p>;
                }

                const suggestionMap = {
                  'Total Cholesterol': [
                    'Reduce oily and fried foods',
                    'Exercise at least 30 minutes most days',
                    'Increase fiber-rich foods (fruits, vegetables, oats)'
                  ],
                  'Glucose (Fasting)': [
                    'Avoid sugary drinks and refined carbs',
                    'Monitor carbohydrate portions with each meal',
                    'Discuss regular monitoring with your doctor'
                  ],
                  Hemoglobin: [
                    'Increase iron-rich foods (green leafy vegetables, meat, lentils)',
                    'Check for chronic blood loss if symptoms persist',
                    'Consider Vitamin B12 and folate evaluation'
                  ]
                };

                return abnormal.slice(0, 4).map((a, idx) => (
                  <div key={idx} style={{ marginTop: idx === 0 ? 8 : 12 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {a.parameter} –{' '}
                      <span style={{ textTransform: 'uppercase', color: getStatusColor(a.status) }}>
                        {a.status}
                      </span>
                    </div>
                    <ul style={{ fontSize: '12px', color: '#64748b', marginTop: 4, paddingLeft: 18 }}>
                      {(suggestionMap[a.parameter] || ['Follow up with your doctor for personalized advice.']).map(
                        (s, i) => (
                          <li key={i}>{s}</li>
                        )
                      )}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div
            className="card"
            style={{
              marginBottom: '20px',
              padding: '16px 18px',
              borderRadius: 18,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
            }}
          >
            <h3>Parameter Dashboard</h3>
            {(!result.analysis || result.analysis.length === 0) ? (
              <p>No parameters available to display in the dashboard.</p>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Patient Value</th>
                      <th>Normal Range</th>
                      <th>Status</th>
                      <th>Indicator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.analysis.map((item, idx) => {
                      const rangeText =
                        item.range?.text ||
                        NORMAL_RANGE_TEXT[item.parameter] ||
                        'N/A';
                      const color = getStatusColor(item.status);
                      const statusLabel = item.status ? item.status.toUpperCase() : 'UNKNOWN';
                      return (
                        <tr key={idx}>
                          <td>{item.parameter}</td>
                          <td>
                            {item.value}
                            {item.unit ? ` ${item.unit}` : ''}
                          </td>
                          <td>{rangeText}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor:
                                item.status === 'normal' ? '#dcfce7' : '#fee2e2',
                              color
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: color
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary list of which tests are normal / low / high */}
                <div style={{ marginTop: 12, fontSize: '13px' }}>
                  {(() => {
                    const all = Array.isArray(result.analysis) ? result.analysis : [];
                    const normalList = all.filter(a => a.status === 'normal').map(a => a.parameter);
                    const lowList = all.filter(a => a.status === 'low').map(a => a.parameter);
                    const highList = all.filter(a => a.status === 'high').map(a => a.parameter);

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#16a34a' }}>Normal</div>
                          <div style={{ color: '#64748b' }}>
                            {normalList.length > 0 ? normalList.join(', ') : 'No parameters in normal range detected.'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#dc2626' }}>Low</div>
                          <div style={{ color: '#64748b' }}>
                            {lowList.length > 0 ? lowList.join(', ') : 'No low values detected.'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#b91c1c' }}>High</div>
                          <div style={{ color: '#64748b' }}>
                            {highList.length > 0 ? highList.join(', ') : 'No high values detected.'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ReportAnalyzer;

