import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const SalaryManagement = () => {
  const [salaries, setSalaries] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get('/api/hr/salaries');
      setSalaries(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/hr/salary', formData);
      alert('Salary record created successfully!');
      setShowForm(false);
      setFormData({});
      fetchSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create salary record');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Salary Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          Create Salary Record
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create Salary Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Employee ID *</label>
              <input
                type="text"
                value={formData.employee || ''}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Month *</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.month || ''}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Year *</label>
              <input
                type="number"
                value={formData.year || new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Base Salary *</label>
              <input
                type="number"
                value={formData.baseSalary || ''}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Bonus</label>
              <input
                type="number"
                value={formData.bonus || ''}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Deduction</label>
              <input
                type="number"
                value={formData.deduction || ''}
                onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </div>
      )}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month/Year</th>
              <th>Base Salary</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map(salary => (
              <tr key={salary._id}>
                <td>{salary.employee?.name}</td>
                <td>{salary.month}/{salary.year}</td>
                <td>₹{salary.baseSalary}</td>
                <td>₹{salary.bonus}</td>
                <td>₹{salary.deduction}</td>
                <td>₹{salary.totalAmount}</td>
                <td>{salary.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryManagement;

