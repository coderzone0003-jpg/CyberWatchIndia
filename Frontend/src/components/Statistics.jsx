import React from 'react';

const stats = [
  { value: '24K+', label: 'Total Complaints' },
  { value: '18K+', label: 'Resolved Cases' },
  { value: '6K+', label: 'Pending Cases' },
  { value: '92%', label: 'Success Rate' }
];

function Statistics() {
  return (
    <section id="track" className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Statistics</span>
          <h2 className="fw-bold mt-3">Impact of our reporting ecosystem</h2>
        </div>
        <div className="row g-4">
          {stats.map((stat) => (
            <div className="col-sm-6 col-lg-3" key={stat.label}>
              <div className="stat-card p-4 text-center h-100">
                <h3 className="display-6 fw-bold text-success">{stat.value}</h3>
                <p className="mb-0 text-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;
