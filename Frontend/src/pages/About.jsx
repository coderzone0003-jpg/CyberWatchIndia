import React from 'react';

function AboutPage() {
  return (
    <section className="section py-5">
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6">
            <span className="section-label">About Us</span>
            <h2 className="fw-bold mt-3">Cyber Crime Portal Mission</h2>
            <p className="text-muted">
              We provide a secure and simple way for citizens to report online fraud, harassment, scams, and digital abuse.
            </p>
            <p className="text-muted">
              Our services include complaint filing, evidence support, case tracking, and awareness education for safer digital living.
            </p>
          </div>
          <div className="col-lg-6">
            <div className="contact-form p-4 rounded-4 shadow-sm">
              <h4 className="fw-bold mb-3">Our Services</h4>
              <ul className="list-unstyled">
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Complaint Registration</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Case Tracking</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Safety Guidance</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Emergency Support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
