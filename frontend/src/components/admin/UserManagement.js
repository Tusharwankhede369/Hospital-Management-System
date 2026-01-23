import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/create-user', formData);
      alert('User created successfully!');
      setShowForm(false);
      setFormData({});
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          Create User
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create User</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
                <option value="hr">HR</option>
              </select>
            </div>
            {formData.role === 'doctor' && (
              <>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fees</label>
                  <input
                    type="number"
                    value={formData.consultationFees || ''}
                    onChange={(e) => setFormData({ ...formData, consultationFees: e.target.value })}
                  />
                </div>
              </>
            )}
            {formData.role === 'staff' && (
              <>
                <div className="form-group">
                  <label>Staff Type</label>
                  <select
                    value={formData.staffType || ''}
                    onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="nurse">Nurse</option>
                    <option value="lab_staff">Lab Staff</option>
                    <option value="ward_staff">Ward Staff</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned Department</label>
                  <input
                    type="text"
                    value={formData.assignedDepartment || ''}
                    onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
                  />
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </div>
      )}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.phone}</td>
                <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

