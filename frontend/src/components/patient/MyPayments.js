import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import api from '../../api';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [unpaidAppointments, setUnpaidAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState('');
  const [toast, setToast] = useState('');

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

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.paymentStatus === 'paid' || p.paymentStatus === 'completed');
    const sum = paid.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const due = unpaidAppointments.reduce((acc, apt) => acc + Number(apt.doctor?.consultationFees || apt.paymentAmount || 0), 0);
    return { count: paid.length, sum, due };
  }, [payments, unpaidAppointments]);

  const handlePayAppointment = async (appointment, paymentMode) => {
    const amount = appointment.doctor?.consultationFees || appointment.paymentAmount || 0;
    if (!amount) {
      setToast('No amount set for this appointment.');
      return;
    }
    setPayingId(appointment._id + paymentMode);
    try {
      await api.post('/api/payments', {
        appointment: appointment._id,
        paymentType: 'appointment',
        amount,
        paymentMode,
        transactionId: 'TXN-' + Date.now()
      });
      setToast('Payment successful');
      fetchPayments();
      fetchUnpaid();
    } catch (error) {
      setToast(error.response?.data?.message || 'Payment failed');
    } finally {
      setPayingId('');
    }
  };

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div className="ph-page">
      <div className="ph-hero">
        <div>
          <h2>Payments</h2>
          <p>Clear dues instantly and keep a clean billing history.</p>
        </div>
      </div>

      <div className="ph-kpis">
        <div className="ph-kpi"><span>Paid so far</span><strong>₹{totals.sum}</strong></div>
        <div className="ph-kpi"><span>Receipts</span><strong>{totals.count}</strong></div>
        <div className="ph-kpi"><span>Amount due</span><strong>₹{totals.due}</strong></div>
      </div>

      {unpaidAppointments.length > 0 && (
        <div className="card ph-card">
          <h3>Pay now</h3>
          <table className="ph-soft-table">
            <thead>
              <tr>
                <th>Visit</th>
                <th>Doctor</th>
                <th>Amount</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {unpaidAppointments.map((apt) => (
                <tr key={apt._id}>
                  <td>{moment(apt.appointmentDate).format('DD MMM YYYY')} {apt.timeSlot}</td>
                  <td>{apt.doctor?.name}<div>{apt.doctor?.department}</div></td>
                  <td>₹{apt.doctor?.consultationFees || apt.paymentAmount || '—'}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      style={{ marginRight: 8 }}
                      disabled={!!payingId}
                      onClick={() => handlePayAppointment(apt, 'upi')}
                    >
                      {payingId === apt._id + 'upi' ? 'Paying...' : 'UPI'}
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!!payingId}
                      onClick={() => handlePayAppointment(apt, 'card')}
                    >
                      {payingId === apt._id + 'card' ? 'Paying...' : 'Card'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card ph-card">
        <h3>Payment history</h3>
        {payments.length === 0 ? (
          <div className="ph-empty">No payments yet.</div>
        ) : (
          <table className="ph-soft-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{moment(payment.createdAt).format('DD MMM YYYY')}</td>
                  <td>{payment.paymentType}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.paymentMode}</td>
                  <td><span className={`status-badge status-${payment.paymentStatus}`}>{payment.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {toast && <div className="ph-toast">{toast}</div>}
    </div>
  );
};

export default MyPayments;
