import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MedicineSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/staff/medicine-schedules');
      setSchedules(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markGiven = async (id, timing, given) => {
    try {
      await axios.put(`/api/staff/medicine-schedule/${id}/mark-given`, { timing, given });
      fetchSchedules();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Medicine Schedule</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Medicine</th>
              <th>Morning</th>
              <th>Afternoon</th>
              <th>Night</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(schedule => (
              <tr key={schedule._id}>
                <td>{schedule.patient?.name}</td>
                <td>{schedule.medicineName || schedule.medicine?.name}</td>
                <td>
                  {schedule.timing.morning && (
                    <button
                      className={`btn ${schedule.timing.morning.given ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => markGiven(schedule._id, 'morning', !schedule.timing.morning.given)}
                    >
                      {schedule.timing.morning.given ? 'Given' : 'Mark Given'}
                    </button>
                  )}
                </td>
                <td>
                  {schedule.timing.afternoon && (
                    <button
                      className={`btn ${schedule.timing.afternoon.given ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => markGiven(schedule._id, 'afternoon', !schedule.timing.afternoon.given)}
                    >
                      {schedule.timing.afternoon.given ? 'Given' : 'Mark Given'}
                    </button>
                  )}
                </td>
                <td>
                  {schedule.timing.night && (
                    <button
                      className={`btn ${schedule.timing.night.given ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => markGiven(schedule._id, 'night', !schedule.timing.night.given)}
                    >
                      {schedule.timing.night.given ? 'Given' : 'Mark Given'}
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

export default MedicineSchedule;

