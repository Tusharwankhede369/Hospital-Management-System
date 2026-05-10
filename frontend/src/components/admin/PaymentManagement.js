import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../../api';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/api/admin/payments');
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this payment record?');
    if (!ok) return;
    try {
      await api.delete(`/api/admin/payments/${id}`);
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete payment');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Payment Management</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{moment(payment.createdAt).format('DD/MM/YYYY')}</td>
                <td>{payment.patient?.name}</td>
                <td>{payment.paymentType}</td>
                <td>₹{payment.amount}</td>
                <td>{payment.paymentMode}</td>
                <td>
                  <span className={`status-badge status-${String(payment.paymentStatus || '').toLowerCase()}`}>
                    {payment.paymentStatus}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(payment._id)}
                    style={{ padding: '5px 10px', fontSize: '14px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentManagement;

