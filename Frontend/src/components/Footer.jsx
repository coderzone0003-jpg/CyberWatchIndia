import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer py-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="fw-bold">Cyber Crime Portal</h5>
            <p className="text-muted mb-0">A trusted digital space for reporting cyber crimes and tracking case progress.</p>
          </div>
          <div className="col-md-4">
            <h5 className="fw-bold">Quick Links</h5>
            <ul className="list-unstyled text-muted">
              <li><Link to="/" className="text-decoration-none">Home</Link></li>
              <li><Link to="/report" className="text-decoration-none">Report Crime</Link></li>
              <li><Link to="/safety" className="text-decoration-none">Safety Tips</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5 className="fw-bold">Follow Us</h5>
            <div className="d-flex gap-3 mt-2">
              <a href="https://www.facebook.com" className="social-link"><i className="bi bi-facebook"></i></a>
              <a href="https://www.twitter.com" className="social-link"><i className="bi bi-twitter-x"></i></a>
              <a href="https://www.instagram.com" className="social-link"><i className="bi bi-instagram"></i></a>
            </div>
            <p className="mt-3 mb-0 text-muted">
              <Link to="/contact" className="text-decoration-none me-3">Privacy Policy</Link>
              <Link to="/contact" className="text-decoration-none">Terms & Conditions</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
