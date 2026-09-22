import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import moment from 'moment';

const doseKeys = ['morning', 'afternoon', 'night'];

const MedicineSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/api/patient/medicine-schedule');
      setSchedules(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    let due = 0;
    let taken = 0;
    schedules.forEach((schedule) => {
      doseKeys.forEach((key) => {
        if (schedule.timing?.[key]) {
          if (schedule.timing[key].given) taken += 1;
          else due += 1;
        }
      });
    });
    const all = due + taken;
    return { due, taken, all, pct: all ? Math.round((taken / all) * 100) : 0 };
  }, [schedules]);

  const markTaken = async (id, timing, given) => {
    setSaving(`${id}-${timing}`);
    try {
      await api.put(`/api/patient/medicine-schedule/${id}/mark-taken`, { timing, given });
      setToast(given ? 'Marked as taken' : 'Marked as not taken');
      fetchSchedules();
    } catch (error) {
      setToast(error.response?.data?.message || 'Could not update dose');
    } finally {
      setSaving('');
    }
  };

  if (loading) return <div className="loading">Loading medicine schedule...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>Medicine schedule</h2>
          <p>Check off today’s doses and stay on track.</p>
        </div>
      </div>

      <div className="ph-kpis">
        <div className="ph-kpi"><span>Active courses</span><strong>{schedules.length}</strong></div>
        <div className="ph-kpi"><span>Taken today</span><strong>{totals.taken}</strong></div>
        <div className="ph-kpi"><span>Still due</span><strong>{totals.due}</strong></div>
      </div>

      <div className="card ph-card">
        <div className="ph-section-title">
          <h3>Adherence</h3>
          <span className="ph-pill">{totals.pct}%</span>
        </div>
        <div className="ph-progress"><span style={{ width: `${totals.pct}%` }} /></div>
      </div>

      {schedules.length === 0 ? (
        <div className="card ph-card ph-empty">No active medicine schedules.</div>
      ) : (
        schedules.map((schedule) => {
          const daysLeft = Math.max(0, moment(schedule.endDate).diff(moment(), 'days'));
          return (
            <div key={schedule._id} className="card ph-card">
              <div className="ph-section-title">
                <div>
                  <h3>{schedule.medicineName || schedule.medicine?.name}</h3>
                  <p>{schedule.dosage} · {daysLeft} days left</p>
                </div>
              </div>
              <div className="ph-timeline">
                {doseKeys.map((timing) =>
                  schedule.timing?.[timing] ? (
                    <div className={`ph-dose ${schedule.timing[timing].given ? 'done' : ''}`} key={timing}>
                      <div>
                        <strong>{timing}</strong>
                        <p>
                          {schedule.timing[timing].time || 'as advised'} ·{' '}
                          {schedule.timing[timing].beforeFood ? 'Before food' : 'After food'}
                        </p>
                      </div>
                      <button
                        className={`btn ${schedule.timing[timing].given ? 'btn-success' : 'btn-primary'}`}
                        disabled={saving === `${schedule._id}-${timing}`}
                        onClick={() => markTaken(schedule._id, timing, !schedule.timing[timing].given)}
                      >
                        {schedule.timing[timing].given ? 'Taken' : 'Mark taken'}
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          );
        })
      )}
      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
};

export default MedicineSchedule;
