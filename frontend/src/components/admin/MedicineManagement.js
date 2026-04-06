import React, { useState, useEffect } from 'react';
import api from '../../api';
import MedicineAutocomplete from '../MedicineAutocomplete';

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/api/medicines');
      setMedicines(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/medicines', formData);
      alert('Medicine added successfully!');
      setShowForm(false);
      setFormData({});
      fetchMedicines();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add medicine');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Medicine Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          Add Medicine
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Add Medicine</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Medicine Name *</label>
              <MedicineAutocomplete
                value={formData.name || ''}
                onChange={(val) => setFormData({ ...formData, name: val })}
                onSelect={(med) => setFormData(prev => ({ ...prev, name: med.name, type: med.type || prev.type, price: med.price ?? prev.price }))}
                placeholder="Type to search (e.g. Paracetamol)..."
                required
              />
              <small style={{ color: '#666' }}>Start typing to see matching medicines from the list. You can select one or enter a new name.</small>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="tablet">Tablet</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
                <option value="capsule">Capsule</option>
                <option value="drops">Drops</option>
              </select>
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={formData.stockQuantity || ''}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        </div>
      )}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map(medicine => (
              <tr key={medicine._id}>
                <td>{medicine.name}</td>
                <td>{medicine.type}</td>
                <td>{medicine.stockQuantity}</td>
                <td>₹{medicine.price || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicineManagement;

