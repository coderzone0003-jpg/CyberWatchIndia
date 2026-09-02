import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatOfficerSummary, getAssignedOfficer } from '../utils/officerDisplay';

function UserDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    investigation: 0,
    resolved: 0,
    rejected: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await api.getMyComplaintStatistics();

      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        investigation: data.under_investigation || 0,
        resolved: data.resolved || 0,
        rejected: data.rejected || 0
      });

      setRecentComplaints(data.recent || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      // Set default values on error
      setStats({
        total: 0,
        pending: 0,
        investigation: 0,
        resolved: 0,
        rejected: 0
      });
      setRecentComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-secondary';
      case 'under investigation': return 'bg-warning text-dark';
      case 'resolved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <section className="section py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="section-label">Citizen Dashboard</span>
          <h1 className="fw-bold mt-3">Welcome to your secure portal</h1>
        </div>

        {error && (
          <div className="alert alert-warning mb-4" role="alert">
            {error}
            <button type="button" className="btn btn-sm btn-outline-warning ms-2" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="row g-4 mb-4">
              <div className="col-6 col-md-3">
                <div className="feature-card p-4 h-100">
                  <h3 className="fw-bold fs-6">Total Complaints</h3>
                  <p className="display-6 text-success fw-bold mb-0">{stats.total}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="feature-card p-4 h-100">
                  <h3 className="fw-bold fs-6">Pending Cases</h3>
                  <p className="display-6 text-warning fw-bold mb-0">{stats.pending}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="feature-card p-4 h-100">
                  <h3 className="fw-bold fs-6">Under Investigation</h3>
                  <p className="display-6 text-warning fw-bold mb-0">{stats.investigation}</p>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="feature-card p-4 h-100">
                  <h3 className="fw-bold fs-6">Resolved Cases</h3>
                  <p className="display-6 text-success fw-bold mb-0">{stats.resolved}</p>
                </div>
              </div>
            </div>

            {recentComplaints.some((c) => getAssignedOfficer(c)) && (
              <div className="contact-form p-4 rounded-4 shadow-sm mb-4">
                <h3 className="fw-bold mb-3">
                  <i className="bi bi-person-badge me-2 text-success"></i>
                  Complaints by Officer
                </h3>
                <div className="row g-3">
                  {recentComplaints.filter((c) => getAssignedOfficer(c)).map((complaint) => {
                    const officer = getAssignedOfficer(complaint);
                    return (
                      <div className="col-md-6" key={complaint.id}>
                        <div className="border rounded-3 p-3 h-100 bg-light">
                          <div className="small text-muted mb-1">{complaint.tracking_id}</div>
                          <div className="fw-semibold mb-2">{complaint.title}</div>
                          <div className="d-flex align-items-start gap-2">
                            <i className="bi bi-shield-check text-success mt-1"></i>
                            <div>
                              <div className="fw-bold">{officer.full_name}</div>
                              {officer.badge_number && (
                                <div className="small text-muted">Badge: {officer.badge_number}</div>
                              )}
                              {officer.specialization && (
                                <div className="small text-muted">{officer.specialization}</div>
                              )}
                              {officer.phone && (
                                <div className="small">Contact: {officer.phone}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="row g-4">
              <div className="col-lg-8">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h3 className="fw-bold mb-3">Recent Complaints</h3>
                  {recentComplaints.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Tracking ID</th>
                            <th>Title</th>
                            <th>Assigned Officer</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentComplaints.map((complaint) => (
                            <tr key={complaint.id}>
                              <td className="tracking-id">
                                <Link
                                  to={`/complaint-details?id=${complaint.id}`}
                                  className="text-decoration-none"
                                >
                                  {complaint.tracking_id}
                                </Link>
                              </td>
                              <td>{complaint.title}</td>
                              <td className="officer-cell">
                                {getAssignedOfficer(complaint) ? (
                                  <span className="officer-text text-success fw-semibold">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {formatOfficerSummary(complaint)}
                                  </span>
                                ) : (
                                  <span className="text-muted">Not assigned yet</span>
                                )}
                              </td>
                              <td className="align-middle">
                                <span className={`badge ${getStatusColor(complaint.status)}`}>
                                  {complaint.status}
                                </span>
                              </td>
                              <td>{formatDate(complaint.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-inbox fs-1 mb-2"></i>
                      <p className="mb-0">No complaints yet</p>
                      <Link className="btn btn-success btn-sm mt-2" to="/report">
                        File Your First Complaint
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-4">
                <div className="contact-form p-4 rounded-4 shadow-sm">
                  <h3 className="fw-bold mb-3">Quick Actions</h3>
                  <div className="d-grid gap-2">
                    <Link className="btn btn-success" to="/my-complaints">
                      View All Complaints
                    </Link>
                    <Link className="btn btn-outline-success" to="/report">
                      File New Complaint
                    </Link>
                    <Link className="btn btn-outline-success" to="/track">
                      Track Complaint
                    </Link>
                    <Link className="btn btn-outline-success" to="/profile">
                      Update Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default UserDashboard;
