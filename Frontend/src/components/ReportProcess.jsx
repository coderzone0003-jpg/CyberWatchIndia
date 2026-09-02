import React from 'react';

const steps = [
  { title: 'Register Account', text: 'Create a secure account to begin your complaint journey.', icon: 'bi-person-plus-fill' },
  { title: 'Submit Complaint', text: 'Describe the incident clearly with the relevant details.', icon: 'bi-journal-text' },
  { title: 'Upload Evidence', text: 'Add screenshots, invoices, chat logs, or transaction proof.', icon: 'bi-cloud-arrow-up-fill' },
  { title: 'Investigation', text: 'Authorities review your case and contact you if required.', icon: 'bi-search-heart' },
  { title: 'Track Status', text: 'Monitor updates and resolve your complaint in real time.', icon: 'bi-graph-up' }
];

function ReportProcess() {
  return (
    <section id="report" className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Report Process</span>
          <h2 className="fw-bold mt-3">How your complaint moves forward</h2>
        </div>
        <div className="row g-4 justify-content-center">
          {steps.map((step, index) => (
            <div className="col-md-6 col-lg-4" key={step.title}>
              <div className="process-card p-4 h-100">
                <div className="step-number">0{index + 1}</div>
                <div className="process-icon mb-3">
                  <i className={`bi ${step.icon}`}></i>
                </div>
                <h3 className="fw-bold">{step.title}</h3>
                <p className="text-muted mb-0">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ReportProcess;
