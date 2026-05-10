import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import api from '../../api';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({ reason: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Book Appointment</h2>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 860 }}>
        <div className="form-group">
          <label>Select Doctor *</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.department} (₹{doctor.consultationFees})
              </option>
            ))}
          </select>
        </div>
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
        {availableSlots.length > 0 && (
          <div className="form-group">
            <label>Select Time Slot *</label>
            <select
              value={formData.timeSlot || ''}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              required
            >
              <option value="">Select Time Slot</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Reason for Visit</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows="4"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;

