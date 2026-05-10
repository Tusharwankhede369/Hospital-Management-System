import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const RoleDashboardLayout = ({ title, subtitle, userName, navItems, onLogout, children }) => {
  const [query, setQuery] = useState('');
  const location = useLocation();

  const filteredItems = useMemo(
    () => navItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())),
    [navItems, query]
  );

  return (
    <div className="role-dashboard-shell">
      <aside className="role-sidebar">
        <div className="role-brand">
          <span className="role-brand-icon">H+</span>
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="role-menu-search">
          <input
            type="text"
            placeholder="Search menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <nav className="role-nav">
          {filteredItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `role-nav-link ${isActive ? 'active' : ''}`}>
              <span>{item.icon || '•'}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="role-main">
        <header className="role-topbar">
          <div>
            <h2>{location.pathname.split('/').pop().replace(/-/g, ' ') || 'Dashboard'}</h2>
            <p>Welcome, {userName}</p>
          </div>
          <button className="btn btn-danger" onClick={onLogout}>
            Logout
          </button>
        </header>
        <section className="role-content">{children}</section>
      </main>
    </div>
  );
};

export default RoleDashboardLayout;
