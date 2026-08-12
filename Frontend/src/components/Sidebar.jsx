import React from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/manage-complaints', label: 'Complaints', icon: 'bi-journal-text' },
  { to: '/manage-users', label: 'Users', icon: 'bi-people-fill' },
  { to: '/manage-officers', label: 'Officers', icon: 'bi-person-badge-fill' },
  { to: '/manage-categories', label: 'Categories', icon: 'bi-list-ul' },
  { to: '/reports', label: 'Reports', icon: 'bi-bar-chart-line-fill' },
  { to: '/audit-logs', label: 'Audit Logs', icon: 'bi-clock-history' },
  { to: '/settings', label: 'Settings', icon: 'bi-gear-fill' },
];

function Sidebar({ onLogout, onNavigate, onClose }) {
  return (
    <aside className="sidebar-card p-3 h-100">
      <div className="d-flex d-lg-none justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Navigation</h6>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} aria-label="Close menu">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="text-center mb-4 d-none d-lg-block">
        <div className="sidebar-brand">C</div>
        <h6 className="fw-bold mt-3 mb-0">Cyber Command</h6>
        <small className="text-muted">Government Control Center</small>
      </div>

      <div className="d-grid gap-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </NavLink>
        ))}
      </div>

      <button
        className="btn btn-outline-danger w-100 mt-4"
        onClick={() => {
          onNavigate?.();
          onLogout?.();
        }}
      >
        <i className="bi bi-box-arrow-right me-2"></i>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
