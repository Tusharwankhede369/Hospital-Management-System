import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/admin/DashboardStats';
import UserManagement from '../components/admin/UserManagement';
import AppointmentManagement from '../components/admin/AppointmentManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import RoomManagement from '../components/admin/RoomManagement';
import MedicineManagement from '../components/admin/MedicineManagement';
import SalaryApproval from '../components/admin/SalaryApproval';
import ReportAnalyzer from '../components/common/ReportAnalyzer';
import ChatWidget from '../components/common/ChatWidget';
import api from '../api';
import '../css/admin-dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const snapshotRef = useRef(null);

  const navItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/admin/users', label: 'User Management', icon: '👥' },
      { to: '/admin/appointments', label: 'Appointments', icon: '📅' },
      { to: '/admin/payments', label: 'Payments', icon: '💳' },
      { to: '/admin/rooms', label: 'Room Management', icon: '🛏️' },
      { to: '/admin/medicines', label: 'Medicine Management', icon: '💊' },
      { to: '/admin/salaries', label: 'Salary Approval', icon: '💼' },
      { to: '/admin/report-analyzer', label: 'Report Analyzer', icon: '🧪' },
    ],
    []
  );

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchText.trim().toLowerCase())
  );
  const unreadCount = notifications.length;
  const openNotifications = () => {
    setShowNotifications((p) => {
      const next = !p;
      if (next) {
        // clear seen notifications immediately on open
        setNotifications([]);
      }
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [dashboardRes, salaryRes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/admin/salaries'),
        ]);

        const pendingFromStats = Number(dashboardRes.data?.pendingSalaries || 0);
        const pendingFromRows = (salaryRes.data || []).filter((s) => s.status === 'pending').length;
        const paidToday = (salaryRes.data || []).filter((s) => s.status === 'paid').length;

        const nextSnap = {
          pendingFromStats,
          pendingFromRows,
          paidToday,
        };

        const prev = snapshotRef.current;
        if (prev && mounted) {
          const updates = [];
          if (nextSnap.pendingFromRows > prev.pendingFromRows) {
            updates.push({
              id: Date.now() + 1,
              text: `${nextSnap.pendingFromRows - prev.pendingFromRows} new salary request(s) pending approval`,
              time: new Date().toLocaleTimeString(),
            });
          }
          if (nextSnap.paidToday > prev.paidToday) {
            updates.push({
              id: Date.now() + 2,
              text: `${nextSnap.paidToday - prev.paidToday} salary payment(s) marked paid`,
              time: new Date().toLocaleTimeString(),
            });
          }
          if (updates.length > 0) {
            setNotifications((curr) => [...updates, ...curr].slice(0, 12));
          }
        }
        snapshotRef.current = nextSnap;
      } catch (err) {
        // keep UI stable even if polling fails
      }
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`admin-dashboard ${isDark ? 'theme-dark' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-dot">H+</span>
          <div>
            <h3>HMS Admin</h3>
            <p>Control Center</p>
          </div>
        </div>
        <nav className="admin-nav">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2>{location.pathname === '/admin/dashboard' ? 'Admin Dashboard' : 'Admin Workspace'}</h2>
            <p>Welcome back, {user?.name || 'Admin'}</p>
          </div>
          <div className="admin-top-actions">
            <input
              type="text"
              className="top-search"
              placeholder="Search menu..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="admin-notification-wrap">
              <button className="icon-btn" title="Notifications" onClick={openNotifications}>
                🔔
              </button>
              {unreadCount > 0 && <span className="notify-dot">{unreadCount}</span>}
              {showNotifications && (
                <div className="notification-panel">
                  <h4 style={{ marginBottom: 8 }}>Notifications</h4>
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No new notifications.</div>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className="notification-item unread">
                        <div style={{ fontSize: 13 }}>{item.text}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{item.time}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => setIsDark((prev) => !prev)} title="Toggle theme">
              {isDark ? '🌙' : '☀️'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
              Profile
            </button>
            <button className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Routes>
            <Route path="dashboard" element={<DashboardStats />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="medicines" element={<MedicineManagement />} />
            <Route path="salaries" element={<SalaryApproval />} />
            <Route path="report-analyzer" element={<ReportAnalyzer />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default AdminDashboard;

