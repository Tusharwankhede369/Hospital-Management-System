import React, { useState } from 'react';
import axios from 'axios';

const CashPayment = () => {
  const [formData, setFormData] = useState({
    patient: '',
    appointment: '',
    paymentType: 'appointment',
    amount: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/staff/cash-payment', formData);
      setMessage('Payment recorded successfully!');
      setFormData({ patient: '', appointment: '', paymentType: 'appointment', amount: '' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <div>
      <h2>Cash Payment Entry</h2>
      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Patient ID *</label>
          <input type="text" name="patient" value={formData.patient} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Appointment ID</label>
          <input type="text" name="appointment" value={formData.appointment} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Payment Type *</label>
          <select name="paymentType" value={formData.paymentType} onChange={handleChange} required>
            <option value="appointment">Appointment</option>
            <option value="admission">Admission</option>
            <option value="lab_test">Lab Test</option>
            <option value="medicine">Medicine</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount (₹) *</label>
          <input type="number" name="amount" value={formData.amount} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">Record Payment</button>
      </form>
    </div>
  );
};

export default CashPayment;

