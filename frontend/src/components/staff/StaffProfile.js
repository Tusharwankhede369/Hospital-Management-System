import React, { useEffect, useState } from 'react';
import api from '../../api';

const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setProfile(res.data);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="card" style={{ maxWidth: 780 }}>
      <h2>My Profile</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 14 }}>Personal account details for staff operations.</p>
      <table className="table">
        <tbody>
          <tr><th>Name</th><td>{profile?.name || '-'}</td></tr>
          <tr><th>Email</th><td>{profile?.email || '-'}</td></tr>
          <tr><th>Phone</th><td>{profile?.phone || '-'}</td></tr>
          <tr><th>Staff Type</th><td>{profile?.staffType || '-'}</td></tr>
          <tr><th>Department</th><td>{profile?.assignedDepartment || '-'}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

export default StaffProfile;
