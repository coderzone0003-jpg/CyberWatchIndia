import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Statistics() {
  const [statistics, setStatistics] = useState({
    total_complaints: 0,
    resolved_cases: 0,
    pending_cases: 0,
    success_rate: '0%'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getComplaintStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const statsList = [
    { value: statistics.total_complaints, label: 'Total Complaints' },
    { value: statistics.resolved_cases, label: 'Resolved Cases' },
    { value: statistics.pending_cases, label: 'Pending Cases' },
    { value: statistics.success_rate, label: 'Success Rate' }
  ];

  return (
    <section id="track" className="section py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-label">Live Statistics</span>
          <h2 className="fw-bold mt-3">Impact of our reporting ecosystem</h2>
        </div>
        <div className="row g-4">
          {statsList.map((stat) => (
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
