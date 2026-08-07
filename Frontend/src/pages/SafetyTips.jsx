import React from 'react';

const tips = [
  {
    title: 'Password Safety',
    description: 'Create long passwords with a mix of letters, numbers, and special characters.',
    icon: 'bi-key-fill'
  },
  {
    title: 'OTP Protection',
    description: 'Never share your OTP with anyone, even if they claim to be a bank official.',
    icon: 'bi-shield-fill-plus'
  },
  {
    title: 'Online Banking Safety',
    description: 'Avoid public Wi-Fi for financial transactions and verify every payment request.',
    icon: 'bi-bank2'
  }
];

function SafetyTipsPage() {
  return (
    <section className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Safety Tips</span>
          <h2 className="fw-bold mt-3">Protect yourself online</h2>
        </div>
        <div className="row g-4">
          {tips.map((tip) => (
            <div className="col-md-4" key={tip.title}>
              <div className="feature-card p-4 h-100">
                <div className="feature-icon mb-3">
                  <i className={`bi ${tip.icon}`}></i>
                </div>
                <h5 className="fw-bold">{tip.title}</h5>
                <p className="text-muted mb-0">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SafetyTipsPage;
