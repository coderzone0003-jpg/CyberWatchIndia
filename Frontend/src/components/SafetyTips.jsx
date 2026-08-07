import React from 'react';

const tips = [
  { title: 'Strong Password', text: 'Use long passwords with symbols, numbers, and mixed case.', icon: 'bi-key-fill' },
  { title: 'Avoid Unknown Links', text: 'Do not click suspicious links sent through messages or emails.', icon: 'bi-link-45deg' },
  { title: 'Protect OTP', text: 'Never share one-time passwords with anyone, including callers.', icon: 'bi-shield-fill-plus' },
  { title: 'Enable Two Factor Authentication', text: 'Add an extra verification step to secure your accounts.', icon: 'bi-lock-fill' }
];

function SafetyTips() {
  return (
    <section id="tips" className="section py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Safety Tips</span>
          <h2 className="fw-bold mt-3">Stay protected online</h2>
        </div>
        <div className="row g-4">
          {tips.map((tip) => (
            <div className="col-md-6 col-lg-3" key={tip.title}>
              <div className="tip-card p-4 h-100">
                <div className="tip-icon mb-3">
                  <i className={`bi ${tip.icon}`}></i>
                </div>
                <h5 className="fw-bold">{tip.title}</h5>
                <p className="text-muted mb-0">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SafetyTips;
