import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', staffType: '', department: '', isActive: '' });
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', staffType: '', assignedDepartment: '', isActive: true });

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStaff = async (override = {}) => {
    try {
      const params = { ...filters, ...override };
      const res = await axios.get('/api/hr/staff', { params });
      setStaff(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchStaff();
  };

  const clearFilters = () => {
    const next = { search: '', staffType: '', department: '', isActive: '' };
    setFilters(next);
    setLoading(true);
    fetchStaff(next);
  };

  const openEdit = (s) => {
    setEditing(s);
    setEditData({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      staffType: s.staffType || '',
      assignedDepartment: s.assignedDepartment || '',
      isActive: !!s.isActive
    });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      await axios.put(`/api/hr/staff/${editing._id}`, editData);
      closeEdit();
      fetchStaff();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update staff');
    }
  };

  const toggleActive = async (s) => {
    const nextActive = !s.isActive;
    const ok = window.confirm(`${nextActive ? 'Activate' : 'Deactivate'} ${s.name}?`);
    if (!ok) return;
    try {
      await axios.put(`/api/hr/staff/${s._id}/active`, { isActive: nextActive });
      fetchStaff();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['EmployeeID', 'Name', 'Email', 'Phone', 'StaffType', 'Department', 'Status'],
      ...staff.map((s) => [
        s._id,
        s.name || '',
        s.email || '',
        s.phone || '',
        s.staffType || '',
        s.assignedDepartment || '',
        s.isActive ? 'Active' : 'Inactive'
      ])
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Staff Management</h2>
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={applyFilters} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto auto', gap: 10, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Name, email, phone..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Staff Type</label>
            <select value={filters.staffType} onChange={(e) => setFilters((p) => ({ ...p, staffType: e.target.value }))}>
              <option value="">All</option>
              <option value="receptionist">Receptionist</option>
              <option value="nurse">Nurse</option>
              <option value="lab_staff">Lab Staff</option>
              <option value="ward_staff">Ward Staff</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Department</label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
              placeholder="e.g. ICU"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={filters.isActive} onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value }))}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Apply</button>
          <button type="button" className="btn" onClick={clearFilters}>Clear</button>
        </form>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Showing <b>{staff.length}</b> staff</div>
          <button type="button" className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
        </div>
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
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 100%)', padding: 18, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit Staff</h3>
              <button className="btn" type="button" onClick={closeEdit}>Close</button>
            </div>
            <form onSubmit={saveEdit} style={{ marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label>Name</label>
                  <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editData.email} onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={editData.phone} onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Staff Type</label>
                  <select value={editData.staffType} onChange={(e) => setEditData((p) => ({ ...p, staffType: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="nurse">Nurse</option>
                    <option value="lab_staff">Lab Staff</option>
                    <option value="ward_staff">Ward Staff</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Assigned Department</label>
                  <input value={editData.assignedDepartment} onChange={(e) => setEditData((p) => ({ ...p, assignedDepartment: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editData.isActive ? 'true' : 'false'} onChange={(e) => setEditData((p) => ({ ...p, isActive: e.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit">Save</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Staff Type</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s._id}>
                <td><code title="Use this ID when creating salary records">{s._id}</code></td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.phone}</td>
                <td>{s.staffType}</td>
                <td>{s.assignedDepartment || 'N/A'}</td>
                <td>{s.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="btn" type="button" onClick={() => openEdit(s)} style={{ padding: '5px 10px', fontSize: 14, marginRight: 8 }}>
                    Edit
                  </button>
                  <button
                    className={s.isActive ? 'btn btn-danger' : 'btn btn-success'}
                    type="button"
                    onClick={() => toggleActive(s)}
                    style={{ padding: '5px 10px', fontSize: 14 }}
                  >
                    {s.isActive ? 'Deactivate' : 'Activate'}
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

export default StaffManagement;

