import React from 'react';

const featureCards = [
  {
    title: 'Confidential Reporting',
    text: 'Your complaint data is protected and handled with strict privacy measures.',
    icon: 'bi-shield-lock'
  },
  {
    title: 'Expert Guidance',
    text: 'Receive step-by-step instructions to document evidence and report incidents effectively.',
    icon: 'bi-person-badge'
  },
  {
    title: 'Faster Resolution',
    text: 'Track your case progress and stay informed through every stage of investigation.',
    icon: 'bi-graph-up-arrow'
  }
];

function About() {
  return (
    <section id="about" className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">About the Portal</span>
          <h2 className="fw-bold mt-3">Empowering citizens to fight cyber crimes</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Our portal helps users report online offenses, seek urgent support, and understand how cyber crime investigations work.
          </p>
        </div>
        <div className="row g-4">
          {featureCards.map((item) => (
            <div className="col-md-4" key={item.title}>
              <div className="feature-card h-100 p-4">
                <div className="feature-icon mb-3">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <h3 className="fw-bold">{item.title}</h3>
                <p className="text-muted mb-0">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
