import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MySalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/staff/my-salary');
        setSalaries(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>My Salary Details</h2>
      <div className="card">
        {salaries.length === 0 ? (
          <p>No salary records found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Month / Year</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Deduction</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(s => (
                <tr key={s._id}>
                  <td>{s.month} / {s.year}</td>
                  <td>₹{s.baseSalary}</td>
                  <td>₹{s.bonus || 0}</td>
                  <td>₹{s.deduction || 0}</td>
                  <td>₹{s.totalAmount}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MySalary;
