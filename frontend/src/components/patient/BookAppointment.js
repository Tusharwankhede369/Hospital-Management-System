import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({ reason: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/patient/doctors');
      setDoctors(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await axios.get('/api/appointments/available-slots', {
        params: { doctor: selectedDoctor, date: selectedDate }
      });
      setAvailableSlots(res.data.availableSlots || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/appointments/book', {
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
      <form onSubmit={handleSubmit} className="card">
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

