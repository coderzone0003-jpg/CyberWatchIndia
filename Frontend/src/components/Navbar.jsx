import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Notifications from './Notifications';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/report', label: 'Report Crime' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/safety', label: 'Safety Tips' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' }
];

function Navbar({ authUser, onLogout }) {
  return (
    <header className="sticky-top">
      <div className="gov-topbar py-2">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-shaded text-success"></i>
            <span className="fw-semibold">Government of India</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold text-success">Emergency Helpline: 1930</span>
            <span className="badge bg-success-subtle text-success">Official Portal</span>
          </div>
        </div>
      </div>
      <nav className="navbar navbar-expand-lg navbar-light shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-shield-lock-fill me-2 text-success"></i>
            Cyber Crime Portal
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#govNavbar">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="govNavbar">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              {publicLinks.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`} to={item.to}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              {!authUser ? (
                <>
                  <li className="nav-item ms-lg-3">
                    <NavLink className="btn btn-outline-success btn-sm" to="/login">Login</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="btn btn-success btn-sm" to="/register">Register</NavLink>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Notifications authUser={authUser} />
                  </li>
                  <li className="nav-item">
                    <NavLink className="btn btn-outline-success btn-sm" to={authUser.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</NavLink>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>Logout</button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
