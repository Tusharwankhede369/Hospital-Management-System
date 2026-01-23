import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/patient/payments');
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentId, paymentMode) => {
    try {
      await axios.post('/api/payments', {
        appointment: payments.find(p => p._id === paymentId)?.appointment?._id,
        paymentType: 'appointment',
        amount: payments.find(p => p._id === paymentId)?.amount,
        paymentMode,
        paymentStatus: 'paid'
      });
      alert('Payment successful!');
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Payment History</h2>
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
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: payment.paymentStatus === 'paid' ? '#d4edda' : '#fff3cd',
                      color: payment.paymentStatus === 'paid' ? '#155724' : '#856404'
                    }}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {payment.paymentStatus === 'pending' && payment.paymentType === 'appointment' && (
                      <div>
                        <button
                          className="btn btn-success"
                          onClick={() => handlePayment(payment._id, 'upi')}
                          style={{ padding: '5px 10px', fontSize: '14px', marginRight: '5px' }}
                        >
                          Pay via UPI
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePayment(payment._id, 'card')}
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          Pay via Card
                        </button>
                      </div>
                    )}
                  </td>
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

