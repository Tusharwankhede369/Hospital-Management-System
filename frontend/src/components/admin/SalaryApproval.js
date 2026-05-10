import React, { useState, useEffect } from 'react';
import api from '../../api';

const SalaryApproval = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // salary object
  const [editData, setEditData] = useState({ baseSalary: '', bonus: '', deduction: '', overtime: '', notes: '', reason: '' });

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const res = await api.get('/api/admin/salaries');
      setSalaries(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/admin/salary/${id}/approve`);
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/api/admin/salary/${id}/mark-paid`, { paymentMode: 'bank_transfer' });
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this salary record? (Paid salaries cannot be deleted)');
    if (!ok) return;
    try {
      await api.delete(`/api/admin/salary/${id}`);
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete salary record');
    }
  };

  const openEdit = (salary) => {
    setEditing(salary);
    setEditData({
      baseSalary: salary.baseSalary ?? '',
      bonus: salary.bonus ?? 0,
      deduction: salary.deduction ?? 0,
      overtime: salary.overtime ?? 0,
      notes: salary.notes ?? '',
      reason: ''
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditData({ baseSalary: '', bonus: '', deduction: '', overtime: '', notes: '', reason: '' });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      await api.put(`/api/admin/salary/${editing._id}`, {
        baseSalary: editData.baseSalary,
        bonus: editData.bonus,
        deduction: editData.deduction,
        overtime: editData.overtime,
        notes: editData.notes,
        editReason: editData.reason
      });
      closeEdit();
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update salary');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar">
        <h2>Salary Approval</h2>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Approve, edit, mark paid and audit-ready operations</div>
      </div>
      {editing && (
        <div
          onClick={closeEdit}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 16
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(720px, 100%)', padding: 18, borderRadius: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit Salary</h3>
              <button className="btn" type="button" onClick={closeEdit}>Close</button>
            </div>
            <p style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
              Editing salary for <b>{editing.employee?.name || 'Employee'}</b> ({editing.month}/{editing.year}). Paid salaries cannot be edited.
            </p>
            <form onSubmit={handleEditSave} style={{ marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label>Base Salary *</label>
                  <input
                    type="number"
                    value={editData.baseSalary}
                    onChange={(e) => setEditData((p) => ({ ...p, baseSalary: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bonus</label>
                  <input
                    type="number"
                    value={editData.bonus}
                    onChange={(e) => setEditData((p) => ({ ...p, bonus: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Deduction</label>
                  <input
                    type="number"
                    value={editData.deduction}
                    onChange={(e) => setEditData((p) => ({ ...p, deduction: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Overtime</label>
                  <input
                    type="number"
                    value={editData.overtime}
                    onChange={(e) => setEditData((p) => ({ ...p, overtime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reason for change *</label>
                <input
                  type="text"
                  value={editData.reason}
                  onChange={(e) => setEditData((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="e.g. Corrected overtime after attendance verification"
                  required
                />
                <small style={{ color: '#64748b' }}>This will be visible to HR in the salary history.</small>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="2"
                  value={editData.notes}
                  onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes for HR/admin"
                />
              </div>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      )}
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
                <td>
                  <span className={`status-badge status-${salary.status}`}>
                    {salary.status}
                  </span>
                </td>
                <td>
                  {salary.status !== 'paid' && (
                    <button
                      className="btn"
                      onClick={() => openEdit(salary)}
                      style={{ padding: '5px 10px', fontSize: '14px', marginRight: 8 }}
                    >
                      Edit
                    </button>
                  )}
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

