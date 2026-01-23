import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const MedicineSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/patient/medicine-schedule');
      setSchedules(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>Medicine Schedule</h2>
      {schedules.length === 0 ? (
        <div className="card">
          <p>No active medicine schedules</p>
        </div>
      ) : (
        schedules.map(schedule => (
          <div key={schedule._id} className="card">
            <h3>{schedule.medicineName || schedule.medicine?.name}</h3>
            <p><strong>Dosage:</strong> {schedule.dosage}</p>
            <p><strong>Duration:</strong> {moment(schedule.endDate).diff(moment(schedule.startDate), 'days')} days</p>
            <div>
              <h4>Timing:</h4>
              {schedule.timing.morning && (
                <p>
                  Morning: {schedule.timing.morning.time} 
                  {schedule.timing.morning.beforeFood ? ' (Before Food)' : ' (After Food)'}
                  {schedule.timing.morning.given && ' ✓ Given'}
                </p>
              )}
              {schedule.timing.afternoon && (
                <p>
                  Afternoon: {schedule.timing.afternoon.time}
                  {schedule.timing.afternoon.beforeFood ? ' (Before Food)' : ' (After Food)'}
                  {schedule.timing.afternoon.given && ' ✓ Given'}
                </p>
              )}
              {schedule.timing.night && (
                <p>
                  Night: {schedule.timing.night.time}
                  {schedule.timing.night.beforeFood ? ' (Before Food)' : ' (After Food)'}
                  {schedule.timing.night.given && ' ✓ Given'}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MedicineSchedule;

