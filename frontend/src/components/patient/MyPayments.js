import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../../api';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [unpaidAppointments, setUnpaidAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
    fetchUnpaid();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/api/patient/payments');
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaid = async () => {
    try {
      const res = await api.get('/api/patient/unpaid-appointments');
      setUnpaidAppointments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAppointment = async (appointment, paymentMode) => {
    const amount = appointment.doctor?.consultationFees || appointment.paymentAmount || 0;
    if (!amount) {
      alert('No amount set for this appointment.');
      return;
    }
    try {
      await api.post('/api/payments', {
        appointment: appointment._id,
        paymentType: 'appointment',
        amount,
        paymentMode,
        transactionId: 'TXN-' + Date.now()
      });
      alert('Payment successful!');
      fetchPayments();
      fetchUnpaid();
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar"><h2>Payments</h2></div>
      {unpaidAppointments.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Pay here (Unpaid appointments)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {unpaidAppointments.map(apt => (
                <tr key={apt._id}>
                  <td>{moment(apt.appointmentDate).format('DD/MM/YYYY')} {apt.timeSlot}</td>
                  <td>{apt.doctor?.name}</td>
                  <td>{apt.doctor?.department}</td>
                  <td>₹{apt.doctor?.consultationFees || apt.paymentAmount || '—'}</td>
                  <td>
                    <button className="btn btn-success" style={{ marginRight: '8px' }} onClick={() => handlePayAppointment(apt, 'upi')}>UPI</button>
                    <button className="btn btn-primary" onClick={() => handlePayAppointment(apt, 'card')}>Card</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h3>Payment History</h3>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No payments found</td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment._id}>
                  <td>{moment(payment.createdAt).format('DD/MM/YYYY')}</td>
                  <td>{payment.paymentType}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.paymentMode}</td>
                  <td>
                    <span className={`status-badge status-${payment.paymentStatus}`}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td>—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyPayments;

