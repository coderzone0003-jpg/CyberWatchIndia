import React, { useState, useEffect, useRef } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthorsModal, setShowAuthorsModal] = useState(false);
  const navRef = useRef(null);

  const authors = [
    { name: 'Shubham Bhojane', role: 'Full Stack & Lead Developer' },
    { name: 'Vinanti Bendure', role: 'Frontend & UI/UX Developer' },
    { name: 'Darshan Seleke', role: 'Backend & Database Engineer' },
    { name: 'Chaitrali Karale', role: 'Security & QA Engineer' }
  ];

  // Close mobile menu on Escape key press or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowAuthorsModal(false);
      }
    };

    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <header className="sticky-top" ref={navRef}>
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
        <nav className="navbar navbar-expand-lg navbar-light shadow-sm bg-white">
          <div className="container">
            <Link className="navbar-brand fw-bold text-success d-flex align-items-center gap-2" to="/" onClick={closeMenu}>
              <i className="bi bi-shield-lock-fill text-success fs-4"></i>
              Cyber Crime Portal
            </Link>
            <button 
              className="navbar-toggler" 
              type="button" 
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="govNavbar">
              <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3 pb-3 pb-lg-0">
                {!authUser && publicLinks.map((item) => (
                  <li className="nav-item" key={item.to}>
                    <NavLink 
                      className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold text-success' : ''}`} 
                      to={item.to}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                {authUser && !isAdmin && authenticatedLinks.map((item) => (
                  <li className="nav-item" key={item.to}>
                    <NavLink 
                      className={({ isActive }) => `nav-link ${isActive ? 'active fw-semibold text-success' : ''}`} 
                      to={item.to}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                
                {/* Developers / Authors option in public menu */}
                {!authUser && (
                  <li className="nav-item">
                    <button 
                      className="btn btn-link nav-link text-secondary text-decoration-none" 
                      onClick={() => {
                        setShowAuthorsModal(true);
                        closeMenu();
                      }}
                    >
                      Developers
                    </button>
                  </li>
                )}

                {!authUser ? (
                  <>
                    <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                      <NavLink className="btn btn-outline-success btn-sm px-3 w-100 w-lg-auto" to="/login" onClick={closeMenu}>Login</NavLink>
                    </li>
                    <li className="nav-item mt-2 mt-lg-0">
                      <NavLink className="btn btn-success btn-sm px-3 w-100 w-lg-auto" to="/register" onClick={closeMenu}>Register</NavLink>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item mt-2 mt-lg-0">
                      <Notifications authUser={authUser} />
                    </li>

                    {/* Profile Icon Dropdown */}
                    <li className="nav-item dropdown ms-lg-2 mt-2 mt-lg-0">
                      <button
                        className="nav-link dropdown-toggle d-flex align-items-center gap-2 text-dark text-decoration-none py-1 px-2 rounded-pill border bg-light btn btn-link"
                        id="profileDropdown"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bi bi-person-circle fs-5 text-success"></i>
                        <span className="fw-medium small d-none d-xl-inline">{authUser.full_name || authUser.email || 'User'}</span>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3 py-2 mt-2" aria-labelledby="profileDropdown">
                        <li>
                          <div className="dropdown-item-text text-muted small pb-2 border-bottom mb-2">
                            Signed in as<br />
                            <strong className="text-dark text-truncate d-block" style={{ maxWidth: '200px' }}>
                              {authUser.email || 'User'}
                            </strong>
                          </div>
                        </li>
                        <li>
                          <Link className="dropdown-item py-2 d-flex align-items-center gap-2" to={isAdmin ? '/admin' : '/dashboard'} onClick={closeMenu}>
                            <i className="bi bi-speedometer2 text-success"></i> Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item py-2 d-flex align-items-center gap-2" to="/profile" onClick={closeMenu}>
                            <i className="bi bi-person-badge text-success"></i> My Profile
                          </Link>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item py-2 d-flex align-items-center gap-2" 
                            onClick={() => {
                              setShowAuthorsModal(true);
                              closeMenu();
                            }}
                          >
                            <i className="bi bi-code-slash text-success"></i> Developers Team
                          </button>
                        </li>
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li>
                          <button 
                            className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger" 
                            onClick={() => {
                              onLogout();
                              closeMenu();
                            }}
                          >
                            <i className="bi bi-box-arrow-right"></i> Logout
                          </button>
                        </li>
                      </ul>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Authors / Developers Modal */}
      {showAuthorsModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header bg-success text-white rounded-top-4">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-shield-lock-fill me-2"></i>SHIELD.AI - Developers Team
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowAuthorsModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted mb-4">
                  National Cyber Crime Reporting Portal (SHIELD.AI) is proudly crafted by the following developers & engineers:
                </p>
                <div className="list-group list-group-flush gap-3">
                  {authors.map((author, index) => (
                    <div key={index} className="list-group-item border rounded-3 p-3 bg-light d-flex align-items-center gap-3">
                      <div className="bg-success-subtle text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                        <i className="bi bi-person-fill fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">{author.name}</h6>
                        <span className="badge bg-success text-white small">{author.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 pb-4 px-4">
                <button 
                  type="button" 
                  className="btn btn-secondary w-100 rounded-pill" 
                  onClick={() => setShowAuthorsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
