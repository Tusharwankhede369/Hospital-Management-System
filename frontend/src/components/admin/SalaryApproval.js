import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalaryApproval = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get('/api/admin/salaries');
      setSalaries(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/admin/salary/${id}/approve`);
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(`/api/admin/salary/${id}/mark-paid`, { paymentMode: 'bank_transfer' });
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this salary record? (Paid salaries cannot be deleted)');
    if (!ok) return;
    try {
      await axios.delete(`/api/admin/salary/${id}`);
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete salary record');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Salary Approval</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Month/Year</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map(salary => (
              <tr key={salary._id}>
                <td>{salary.employee?.name}</td>
                <td>{salary.employee?.role || '—'}</td>
                <td>{salary.month}/{salary.year}</td>
                <td>₹{salary.totalAmount}</td>
                <td>{salary.status}</td>
                <td>
                  {salary.status === 'pending' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(salary._id)}
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      Approve
                    </button>
                  )}
                  {salary.status === 'approved' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleMarkPaid(salary._id)}
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      Mark as Paid
                    </button>
                  )}
                  {salary.status !== 'paid' && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(salary._id)}
                      style={{ padding: '5px 10px', fontSize: '14px', marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryApproval;

