import React, { useState } from 'react';

const HiringPipeline = () => {
  const [jobs, setJobs] = useState([
    { id: 1, role: 'Nurse', department: 'ICU', status: 'open', applicants: 12 },
    { id: 2, role: 'Lab Technician', department: 'Pathology', status: 'screening', applicants: 7 },
  ]);
  const [form, setForm] = useState({ role: '', department: '' });

  const addJob = (e) => {
    e.preventDefault();
    if (!form.role || !form.department) return;
    setJobs((prev) => [
      { id: Date.now(), role: form.role, department: form.department, status: 'open', applicants: 0 },
      ...prev,
    ]);
    setForm({ role: '', department: '' });
  };

  const advance = (id) => {
    const order = ['open', 'screening', 'interview', 'offered', 'closed'];
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const idx = order.indexOf(j.status);
        return { ...j, status: order[Math.min(order.length - 1, idx + 1)] };
      })
    );
  };

  return (
    <div>
      <div className="table-toolbar"><h2>Hiring Pipeline</h2></div>
      <form className="card" onSubmit={addJob} style={{ marginBottom: 14 }}>
        <div className="auth-grid">
          <div className="form-group">
            <label>Role</label>
            <input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Ward Nurse" />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. ICU" />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Add Job Requisition</button>
      </form>

      <div className="card">
        <table className="table">
          <thead><tr><th>Role</th><th>Department</th><th>Applicants</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.role}</td>
                <td>{job.department}</td>
                <td>{job.applicants}</td>
                <td><span className={`status-badge status-${job.status === 'closed' ? 'inactive' : 'pending'}`}>{job.status}</span></td>
                <td><button className="btn btn-secondary" onClick={() => advance(job.id)}>Advance Stage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HiringPipeline;
