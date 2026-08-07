import React from 'react';

function Hero() {
  return (
    <section id="home" className="hero-section py-5">
      <div className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-7">
            <div className="badge rounded-pill bg-success-subtle text-success mb-3 px-3 py-2">
              <i className="bi bi-shield-check me-2"></i>
              Secure, fast, and confidential reporting
            </div>
            <h1 className="display-4 fw-bold mb-3">
              Report Cyber Crime <span className="text-success">Securely</span>
            </h1>
            <p className="lead text-muted mb-4">
              Report online fraud, impersonation, harassment, and financial scams with trusted support and real-time complaint tracking.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <a href="#report" className="btn btn-success btn-lg px-4">Report Crime</a>
              <a href="#track" className="btn btn-outline-success btn-lg px-4">Track Complaint</a>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="hero-card p-4 shadow-lg">
              <div className="d-flex align-items-center mb-3">
                <div className="hero-icon me-3">
                  <i className="bi bi-lightning-charge-fill"></i>
                </div>
                <div>
                  <h5 className="mb-0">Immediate Assistance</h5>
                  <p className="mb-0 text-muted">24/7 reporting support</p>
                </div>
              </div>
              <ul className="list-unstyled">
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Fast complaint registration</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Evidence upload support</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Secure status updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
