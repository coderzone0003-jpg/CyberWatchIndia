import React from 'react';

function Helpline() {
  return (
    <section className="section py-5 bg-success text-white">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-lg-7">
            <span className="section-label text-white-50">Emergency Support</span>
            <h2 className="fw-bold mt-3">Need immediate help? Reach out now</h2>
            <p className="mb-0">Use the national cyber helpline or emergency services for urgent cases.</p>
          </div>
          <div className="col-lg-5">
            <div className="helpline-card p-4 rounded-4">
              <div className="d-flex justify-content-between mb-3">
                <span><i className="bi bi-phone-fill me-2"></i>Cyber Helpline</span>
                <strong>1930</strong>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span><i className="bi bi-telephone-fill me-2"></i>Police</span>
                <strong>112</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span><i className="bi bi-envelope-fill me-2"></i>Email Support</span>
                <strong>support@cyberportal.gov</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Helpline;
