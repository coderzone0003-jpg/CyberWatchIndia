import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Notifications from './Notifications';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/safety', label: 'Safety Tips' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' }
];

const authenticatedLinks = [
  { to: '/report', label: 'Report Crime' },
  { to: '/track', label: 'Track Complaint' }
];

function Navbar({ authUser, isAdmin, onLogout }) {
  return (
    <header className="sticky-top">
      <div className="gov-topbar py-2">
        <div className="container">
          <div className="gov-topbar-inner">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-shaded text-success"></i>
              <span className="fw-semibold gov-topbar-title">Government of India</span>
            </div>
            <div className="d-flex align-items-center gap-2 gap-md-3 gov-topbar-meta">
              <span className="fw-semibold text-success gov-helpline">
                <span className="d-none d-sm-inline">Emergency Helpline: </span>1930
              </span>
              <span className="badge bg-success-subtle text-success">Official Portal</span>
            </div>
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
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2 pb-3 pb-lg-0">
              {!authUser && publicLinks.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`} to={item.to}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              {authUser && !isAdmin && authenticatedLinks.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold' : ''}`} to={item.to}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              {!authUser ? (
                <>
                  <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                    <NavLink className="btn btn-outline-success btn-sm w-100 w-lg-auto" to="/login">Login</NavLink>
                  </li>
                  <li className="nav-item mt-2 mt-lg-0">
                    <NavLink className="btn btn-success btn-sm w-100 w-lg-auto" to="/register">Register</NavLink>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item mt-2 mt-lg-0">
                    <Notifications authUser={authUser} />
                  </li>
                  <li className="nav-item mt-2 mt-lg-0">
                    <NavLink className="btn btn-outline-success btn-sm w-100 w-lg-auto" to={isAdmin ? '/admin' : '/dashboard'}>Dashboard</NavLink>
                  </li>
                  <li className="nav-item mt-2 mt-lg-0">
                    <button className="btn btn-outline-danger btn-sm w-100 w-lg-auto" onClick={onLogout}>Logout</button>
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