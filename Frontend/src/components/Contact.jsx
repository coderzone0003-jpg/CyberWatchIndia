import React from 'react';

function Contact() {
  return (
    <section id="contact" className="section py-5">
      <div className="container">
        <div className="row g-5 align-items-start">
          <div className="col-lg-5">
            <span className="section-label">Contact Us</span>
            <h2 className="fw-bold mt-3">Need help? Send us a message</h2>
            <p className="text-muted">
              Our support team can help you with complaint filing, evidence guidance, and status questions.
            </p>
            <div className="contact-info mt-4">
              <p><i className="bi bi-envelope-fill text-success me-2"></i>support@cyberportal.gov</p>
              <p><i className="bi bi-telephone-fill text-success me-2"></i>+91 1800 123 456</p>
              <p><i className="bi bi-geo-alt-fill text-success me-2"></i>National Cyber Safety Center, New Delhi</p>
            </div>
          </div>
          <div className="col-lg-7">
            <form className="contact-form p-4 shadow-sm">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" placeholder="Your name" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="you@example.com" />
                </div>
                <div className="col-12">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" placeholder="Phone number" />
                </div>
                <div className="col-12">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows="5" placeholder="Describe your concern"></textarea>
                </div>
                <div className="col-12">
                  <button className="btn btn-success w-100" type="button">Send Message</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
