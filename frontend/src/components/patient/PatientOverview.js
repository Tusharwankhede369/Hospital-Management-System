import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import api from '../../api';

const PatientOverview = () => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, aptRes, medRes, unpaidRes] = await Promise.all([
          api.get('/api/patient/profile'),
          api.get('/api/patient/appointments'),
          api.get('/api/patient/medicine-schedule'),
          api.get('/api/patient/unpaid-appointments')
        ]);
        setProfile(profileRes.data);
        setAppointments(aptRes.data || []);
        setSchedules(medRes.data || []);
        setUnpaid(unpaidRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = useMemo(
    () =>
      appointments
        .filter((apt) => ['pending', 'confirmed'].includes(apt.status) && moment(apt.appointmentDate).isSameOrAfter(moment(), 'day'))
        .sort((a, b) => moment(a.appointmentDate).diff(moment(b.appointmentDate))),
    [appointments]
  );

  const completeness = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      profile.name,
      profile.phone,
      profile.address,
      profile.gender,
      profile.dateOfBirth,
      profile.bloodGroup,
      profile.emergencyContact?.name,
      profile.emergencyContact?.phone
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const todayDoses = useMemo(() => {
    const slots = [];
    schedules.forEach((schedule) => {
      ['morning', 'afternoon', 'night'].forEach((timing) => {
        if (schedule.timing?.[timing]) {
          slots.push({
            id: `${schedule._id}-${timing}`,
            name: schedule.medicineName || schedule.medicine?.name,
            timing,
            time: schedule.timing[timing].time,
            given: schedule.timing[timing].given
          });
        }
      });
    });
    return slots;
  }, [schedules]);

  if (loading) return <div className="loading">Loading your health hub...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>Hello, {profile?.name?.split(' ')[0] || 'there'}</h2>
          <p>Your personal health snapshot for {moment().format('dddd, DD MMM YYYY')}</p>
        </div>
        <Link to="/patient/book-appointment" className="btn btn-primary">Book visit</Link>
      </div>

      <div className="ph-kpis">
        <div className="ph-kpi">
          <span>Upcoming visits</span>
          <strong>{upcoming.length}</strong>
        </div>
        <div className="ph-kpi">
          <span>Active medicines</span>
          <strong>{schedules.length}</strong>
        </div>
        <div className="ph-kpi">
          <span>Unpaid bills</span>
          <strong>{unpaid.length}</strong>
        </div>
        <div className="ph-kpi">
          <span>Profile complete</span>
          <strong>{completeness}%</strong>
        </div>
      </div>

      <div className="ph-grid-2">
        <div className="card ph-card">
          <div className="ph-section-title">
            <h3>Next appointments</h3>
            <Link to="/patient/appointments" className="ph-link-btn">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="ph-empty">No upcoming visits. Book one when you need care.</div>
          ) : (
            upcoming.slice(0, 4).map((apt) => (
              <div className="ph-list-item" key={apt._id}>
                <div>
                  <strong>{apt.doctor?.name || 'Doctor'}</strong>
                  <p>{apt.department} · Token {apt.tokenNumber || '—'}</p>
                </div>
                <div>
                  <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
                  <p>{moment(apt.appointmentDate).format('DD MMM')} · {apt.timeSlot}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card ph-card">
          <div className="ph-section-title">
            <h3>Today’s medicines</h3>
            <Link to="/patient/medicine-schedule" className="ph-link-btn">Schedule</Link>
          </div>
          {todayDoses.length === 0 ? (
            <div className="ph-empty">No active doses for today.</div>
          ) : (
            todayDoses.slice(0, 5).map((dose) => (
              <div className={`ph-dose ${dose.given ? 'done' : ''}`} key={dose.id}>
                <div>
                  <strong>{dose.name}</strong>
                  <p>{dose.timing} · {dose.time || 'as advised'}</p>
                </div>
                <span className={`status-badge ${dose.given ? 'status-paid' : 'status-pending'}`}>
                  {dose.given ? 'Taken' : 'Due'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
