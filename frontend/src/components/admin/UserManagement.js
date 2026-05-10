import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});
  const [managerForm, setManagerForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showForm, setShowForm] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
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
      await api.post('/api/admin/create-user', formData);
      setToast('User created successfully.');
      setShowForm(false);
      setFormData({});
      fetchUsers();
    } catch (error) {
      setToast(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeactivate = async (id, name) => {
    const ok = window.confirm(`Deactivate user "${name}"? They will not be able to log in.`);
    if (!ok) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setToast(`"${name}" deactivated.`);
      fetchUsers();
    } catch (error) {
      setToast(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/create-admin-manager', managerForm);
      setToast('Admin manager created successfully.');
      setManagerForm({ name: '', email: '', phone: '', password: '' });
      setShowManagerForm(false);
      fetchUsers();
    } catch (error) {
      setToast(error.response?.data?.message || 'Failed to create admin manager');
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredUsers = users.filter((item) => {
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.phone?.toLowerCase().includes(term);
    const matchesRole = roleFilter ? item.role === roleFilter : true;
    return matchesQuery && matchesRole;
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="table-toolbar">
        <h2>User Management</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Search user..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
            <option value="hr">HR</option>
            <option value="patient">Patient</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="admin_manager">Admin Manager</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Create User
          </button>
          {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
            <button className="btn btn-secondary" onClick={() => setShowManagerForm(!showManagerForm)}>
              + Create Admin Manager
            </button>
          )}
        </div>
      </div>
      {showManagerForm && (currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create Admin Manager</h3>
          <form onSubmit={handleCreateManager}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={managerForm.name}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={managerForm.email}
                onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={managerForm.phone}
                onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Temporary Password *</label>
              <input
                type="password"
                value={managerForm.password}
                onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Admin Manager</button>
          </form>
        </div>
      )}
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
              <label>Password (optional)</label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to use default password"
              />
              <small style={{ color: '#666' }}>Leave blank to use the default new-user password (set in backend).</small>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.phone}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {(currentUser?.role !== 'owner' && user.role === 'owner') ? (
                    <span style={{ color: '#64748b', fontSize: 13 }}>Protected</span>
                  ) : user.isActive ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeactivate(user._id, user.name)}
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: 13 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
};

export default UserManagement;

