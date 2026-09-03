import React from 'react';
import { Link } from 'react-router-dom';

function Footer({ authUser }) {
  return (
    <footer className="footer py-3">
      <div className="container">
        <div className="row g-3">
          <div className="col-md-4">
            <h3 className="fw-bold mb-2">Cyber Crime Portal</h3>
            <p className="mb-0 text-white small">A trusted digital space for reporting cyber crimes and tracking case progress.</p>
          </div>
          <div className="col-md-4">
            <h3 className="fw-bold mb-2">Quick Links</h3>
            <ul className="list-unstyled text-muted mb-0 small">
              <li><Link to="/" className="text-decoration-none">Home</Link></li>
              {authUser && <li><Link to="/report" className="text-decoration-none">Report Crime</Link></li>}
              <li><Link to="/safety" className="text-decoration-none">Safety Tips</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h3 className="fw-bold mb-2">Follow Us</h3>
            <div className="d-flex gap-3 mb-2">
              <a href="https://www.facebook.com" className="social-link"><i className="bi bi-facebook"></i></a>
              <a href="https://www.twitter.com" className="social-link"><i className="bi bi-twitter-x"></i></a>
              <a href="https://www.instagram.com" className="social-link"><i className="bi bi-instagram"></i></a>
            </div>
            <p className="mb-0 small">
              <Link to="/contact" className="text-decoration-none me-3">Privacy Policy</Link>
              <Link to="/contact" className="text-decoration-none">Terms & Conditions</Link>
            </p>
          </div>
        </div>
        <div className="row mt-3 pt-2 border-top border-secondary">
          <div className="col-12 text-center">
            <p className="mb-0 text-white small">&copy; 2026 Cyber Crime Portal. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
