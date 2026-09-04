import React from 'react';

function Helpline() {
  return (
    <section className="py-3 bg-success text-white">
      <div className="container py-2">
        <div className="row align-items-center g-4">
          <div className="col-lg-7">
            <span className="section-label" style={{ color: '#14532d' }}>Emergency Support</span>
            <h2 className="fw-bold mt-3">Need immediate help? Reach out now</h2>
            <p className="mb-0">Use the national cyber helpline or emergency services for urgent cases.</p>
          </div>
          <div className="col-lg-5">
            <div className="helpline-card p-4">
              <div className="d-flex justify-content-between mb-3">
                <span><i className="bi bi-phone-fill me-2"></i>Cyber Helpline</span>
                <div className="text-end">
                  <strong>1930</strong>
                  <br /><small className="text-muted">24/7</small>
                </div>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span><i className="bi bi-telephone-fill me-2"></i>Police</span>
                <div className="text-end">
                  <strong>112</strong>
                  <br /><small className="text-muted">Emergency</small>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span><i className="bi bi-envelope-fill me-2"></i>Email Support</span>
                <div className="text-end">
                  <strong>support@cyberportal.gov</strong>
                  <br /><small className="text-muted">Response within 24 hrs</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Helpline;
