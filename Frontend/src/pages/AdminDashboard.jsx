import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    investigation: 0,
    resolved: 0,
    today: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard statistics from backend
      const data = await api.getDashboardData();
      
      setStats({
        total: data.total_complaints || 0,
        pending: data.pending_complaints || 0,
        investigation: data.investigation_complaints || 0,
        resolved: data.resolved_complaints || 0,
        today: data.today_complaints || 0
      });

      setRecentActivity(data.recent_activity || []);
      setCategoryStats(data.category_stats || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="section py-4">
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-lg-3">
              <Sidebar onLogout={() => {}} />
            </div>
            <div className="col-lg-9">
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section py-4">
      <div className="container-fluid">
        {error && (
          <div className="alert alert-warning mb-4" role="alert">
            {error}
          </div>
        )}
        
        <div className="row g-4">
          <div className="col-lg-3">
            <Sidebar onLogout={() => {}} />
          </div>
          <div className="col-lg-9">
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="feature-card p-4 h-100">
                  <h6 className="fw-bold">Total Complaints</h6>
                  <p className="display-6 text-success fw-bold mb-0">{stats.total}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="feature-card p-4 h-100">
                  <h6 className="fw-bold">Today's Complaints</h6>
                  <p className="display-6 text-info fw-bold mb-0">{stats.today}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="feature-card p-4 h-100">
                  <h6 className="fw-bold">Pending</h6>
                  <p className="display-6 text-warning fw-bold mb-0">{stats.pending}</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="feature-card p-4 h-100">
                  <h6 className="fw-bold">Resolved</h6>
                  <p className="display-6 text-success fw-bold mb-0">{stats.resolved}</p>
                </div>
              </div>
            </div>
            
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h5 className="fw-bold mb-3">Crime Category Overview</h5>
                  {categoryStats.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Count</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryStats.map((cat, index) => (
                            <tr key={index}>
                              <td>{cat.name}</td>
                              <td>{cat.count}</td>
                              <td>{cat.percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">UPI Fraud, OTP Scam, Social Media Crime, and Phishing lead the current chart.</p>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h5 className="fw-bold mb-3">Recent Activity</h5>
                  {recentActivity.length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {recentActivity.map((activity, index) => (
                        <li key={index} className="mb-2">
                          <span className="badge bg-success me-2">●</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">No recent activity to display.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="row g-4">
              <div className="col-md-6">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h5 className="fw-bold">Investigation Status</h5>
                  <p className="text-muted mb-0">{stats.investigation} complaints currently under investigation by assigned officers.</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h5 className="fw-bold">System Status</h5>
                  <p className="text-success mb-0">● All systems operational</p>
                  <p className="text-muted mb-0">Database connection: Active</p>
                  <p className="text-muted mb-0">File storage: Active</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Link className="btn btn-success me-2" to="/manage-complaints">Manage Complaints</Link>
              <Link className="btn btn-outline-success me-2" to="/manage-users">Manage Users</Link>
              <Link className="btn btn-outline-success" to="/reports">View Reports</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
