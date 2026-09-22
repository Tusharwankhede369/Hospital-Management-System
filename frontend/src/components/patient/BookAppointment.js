import React, { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';
import api from '../../api';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({ reason: '', timeSlot: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/api/patient/doctors');
      setDoctors(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      const res = await api.get('/api/appointments/available-slots', {
        params: { doctor: selectedDoctor, date: selectedDate }
      });
      setAvailableSlots(res.data.availableSlots || []);
    } catch (error) {
      console.error(error);
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    fetchAvailableSlots();
  }, [selectedDoctor, selectedDate, fetchAvailableSlots]);

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(doctors.map((d) => d.department).filter(Boolean)))],
    [doctors]
  );

  const visibleDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchDept = department === 'all' || doctor.department === department;
        const hay = `${doctor.name} ${doctor.department} ${doctor.qualification || ''}`.toLowerCase();
        return matchDept && hay.includes(search.trim().toLowerCase());
      }),
    [doctors, department, search]
  );

  const selected = doctors.find((d) => d._id === selectedDoctor);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/api/appointments/book', {
        doctor: selectedDoctor,
        appointmentDate: selectedDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason
      });
      setMessage('Appointment booked successfully!');
      setFormData({ reason: '', timeSlot: '' });
      setSelectedDate('');
      setSelectedDoctor('');
      setAvailableSlots([]);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>Book a visit</h2>
          <p>Choose a doctor, pick a slot, and confirm in a few taps.</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card ph-card">
          <div className="ph-toolbar">
            <input className="ph-search" placeholder="Search doctors" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'all' ? 'All departments' : dept}</option>
              ))}
            </select>
          </div>
          <div className="ph-doctor-grid">
            {visibleDoctors.map((doctor) => (
              <button
                type="button"
                key={doctor._id}
                className={`ph-doctor-card ${selectedDoctor === doctor._id ? 'selected' : ''}`}
                onClick={() => setSelectedDoctor(doctor._id)}
              >
                <strong>{doctor.name}</strong>
                <p>{doctor.department}</p>
                <p>{doctor.qualification || 'Consultant'}</p>
                <span className="ph-pill">₹{doctor.consultationFees || 0}</span>
              </button>
            ))}
          </div>
          {visibleDoctors.length === 0 && <div className="ph-empty">No doctors match your search.</div>}
        </div>

        <div className="card ph-card">
          <div className="ph-form-grid">
            <div className="form-group">
              <label>Select Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={moment().format('YYYY-MM-DD')}
                required
              />
            </div>
            <div className="form-group">
              <label>Selected doctor</label>
              <input value={selected ? `${selected.name} · ${selected.department}` : 'Pick a doctor card'} disabled />
            </div>
          </div>

          {availableSlots.length > 0 && (
            <div className="form-group">
              <label>Available slots</label>
              <div className="ph-slots">
                {availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    className={`ph-slot ${formData.timeSlot === slot ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, timeSlot: slot })}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Reason for visit</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows="4"
              placeholder="Describe symptoms or follow-up needs"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !selectedDoctor || !formData.timeSlot}>
            {loading ? 'Booking...' : 'Confirm appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;
