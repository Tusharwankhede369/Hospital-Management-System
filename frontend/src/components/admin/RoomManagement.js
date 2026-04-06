import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/api/rooms');
      setRooms(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rooms', formData);
      alert('Room created successfully!');
      setShowForm(false);
      setFormData({});
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create room');
    }
  };

  const handleDelete = async (id, roomNumber) => {
    const ok = window.confirm(`Delete room "${roomNumber}"?`);
    if (!ok) return;
    try {
      await axios.delete(`/api/rooms/${id}`);
      fetchRooms();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete room');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Room Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          Create Room
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create Room</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Room Number *</label>
              <input
                type="text"
                value={formData.roomNumber || ''}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Room Type *</label>
              <select
                value={formData.roomType || ''}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="general">General</option>
                <option value="icu">ICU</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input
                type="number"
                value={formData.floor || ''}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bed Count *</label>
              <input
                type="number"
                min="1"
                value={formData.bedCount || ''}
                onChange={(e) => setFormData({ ...formData, bedCount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Charges (₹)</label>
              <input
                type="number"
                value={formData.charges || ''}
                onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
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
              <th>Room Number</th>
              <th>Type</th>
              <th>Floor</th>
              <th>Bed Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room._id}>
                <td>{room.roomNumber}</td>
                <td>{room.roomType}</td>
                <td>{room.floor || 'N/A'}</td>
                <td>{room.bedCount}</td>
                <td>{room.status}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(room._id, room.roomNumber)}
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

export default RoomManagement;

