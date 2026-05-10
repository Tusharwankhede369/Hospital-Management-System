import React, { useState } from 'react';

const TaskBoard = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Morning patient round checklist', done: false, priority: 'high' },
    { id: 2, title: 'Verify medicine schedule updates', done: false, priority: 'medium' },
  ]);
  const [title, setTitle] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((prev) => [{ id: Date.now(), title: title.trim(), done: false, priority: 'low' }, ...prev]);
    setTitle('');
  };

  const toggle = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div>
      <div className="table-toolbar"><h2>Staff Task Board</h2></div>
      <form className="card" onSubmit={addTask} style={{ marginBottom: 12 }}>
        <div className="form-group">
          <label>New Task</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add daily operational task" />
        </div>
        <button className="btn btn-primary" type="submit">Add Task</button>
      </form>
      <div className="card">
        <table className="table">
          <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.priority}</td>
                <td><span className={`status-badge ${t.done ? 'status-active' : 'status-pending'}`}>{t.done ? 'done' : 'pending'}</span></td>
                <td><button className="btn btn-secondary" onClick={() => toggle(t.id)}>{t.done ? 'Undo' : 'Mark Done'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskBoard;
