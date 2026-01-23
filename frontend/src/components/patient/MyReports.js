import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/patient/reports');
      setReports(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2>My Reports</h2>
      <div className="card">
        {reports.length === 0 ? (
          <p>No reports found</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Test Name</th>
                <th>Test Type</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id}>
                  <td>{moment(report.createdAt).format('DD/MM/YYYY')}</td>
                  <td>{report.testName}</td>
                  <td>{report.testType}</td>
                  <td>{report.doctor?.name || 'N/A'}</td>
                  <td>{report.status}</td>
                  <td>
                    {report.reportFile && (
                      <a href={`http://localhost:5000/${report.reportFile}`} target="_blank" rel="noopener noreferrer">
                        View Report
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyReports;

