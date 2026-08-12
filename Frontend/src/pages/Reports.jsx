import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
    status: '',
    officer_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    fetchReportData();
    fetchCategories();
    fetchOfficers();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const data = await api.getComplaintCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchOfficers = async () => {
    try {
      const data = await api.getAdminOfficers();
      setOfficers(data);
    } catch (err) {
      console.error('Failed to fetch officers:', err);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });

      const data = await api.getAdminReports(params);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError(err.message || 'Failed to load report data. Please try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      category_id: '',
      status: '',
      officer_id: ''
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading reports...</p>
      </div>
    );
  }

  return (
    <>
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}
        
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Reports & Analytics</h4>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-danger" 
                onClick={() => {
                  const params = {};
                  Object.keys(filters).forEach(key => {
                    if (filters[key]) params[key] = filters[key];
                  });
                  api.exportPDF(params);
                }}
                title="Export as PDF"
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
              </button>
              <button 
                className="btn btn-outline-success" 
                onClick={() => {
                  const params = {};
                  Object.keys(filters).forEach(key => {
                    if (filters[key]) params[key] = filters[key];
                  });
                  api.exportExcel(params);
                }}
                title="Export as Excel"
              >
                <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
              </button>
              <button className="btn btn-success" onClick={fetchReportData}>
                <i className="bi bi-arrow-clockwise me-2"></i>Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-2">
              <label className="form-label small">Start Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small">End Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Status</label>
              <select
                className="form-select form-select-sm"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="under investigation">Under Investigation</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Category</label>
              <select
                className="form-select form-select-sm"
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Officer</label>
              <select
                className="form-select form-select-sm"
                name="officer_id"
                value={filters.officer_id}
                onChange={handleFilterChange}
              >
                <option value="">All Officers</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.id}>
                    {officer.full_name || officer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {stats && (
            <>
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Total Complaints</h5>
                    <p className="display-6 text-success fw-bold mb-0">{stats.total}</p>
                    <p className="text-muted small mb-0">In selected period</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Pending</h5>
                    <p className="display-6 text-warning fw-bold mb-0">{stats.by_status?.pending || 0}</p>
                    <p className="text-muted small mb-0">Awaiting action</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Under Investigation</h5>
                    <p className="display-6 text-info fw-bold mb-0">{stats.by_status?.['under investigation'] || 0}</p>
                    <p className="text-muted small mb-0">Active cases</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Resolved</h5>
                    <p className="display-6 text-success fw-bold mb-0">{stats.by_status?.resolved || 0}</p>
                    <p className="text-muted small mb-0">Successfully closed</p>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold mb-3">Crime Category Distribution</h5>
                    {Object.keys(stats.by_category || {}).length > 0 ? (
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
                            {Object.entries(stats.by_category)
                              .sort(([, a], [, b]) => b - a)
                              .map(([name, count], index) => {
                                const total = stats.total || 1;
                                const percent = Math.round((count / total) * 100);
                                return (
                                  <tr key={index}>
                                    <td>{name}</td>
                                    <td>{count}</td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                          <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${percent}%` }}
                                          ></div>
                                        </div>
                                        <span className="small">{percent}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No category data available</p>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold mb-3">Severity Distribution</h5>
                    {Object.keys(stats.by_severity || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Severity</th>
                              <th>Count</th>
                              <th>Badge</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.by_severity).map(([severity, count], index) => {
                              const badgeClass = {
                                'low': 'bg-success',
                                'medium': 'bg-warning',
                                'high': 'bg-danger',
                                'critical': 'bg-dark'
                              }[severity] || 'bg-secondary';
                              return (
                                <tr key={index}>
                                  <td style={{ textTransform: 'capitalize' }}>{severity}</td>
                                  <td>{count}</td>
                                  <td><span className={`badge ${badgeClass}`}>{severity}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No severity data available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold mb-3">Officer Distribution</h5>
                    {Object.keys(stats.by_officer || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Officer</th>
                              <th>Cases</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.by_officer)
                              .sort(([, a], [, b]) => b - a)
                              .map(([name, count], index) => (
                                <tr key={index}>
                                  <td>{name}</td>
                                  <td>{count}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No officer assignments yet</p>
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Total Users</h5>
                    <p className="display-6 text-info fw-bold mb-0">{stats.total_users || 0}</p>
                    <p className="text-muted mb-0">Registered users</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold">Avg Resolution Time</h5>
                    <p className="display-6 text-primary fw-bold mb-0">{stats.avg_resolution_days || 0}</p>
                    <p className="text-muted mb-0">Days to resolve</p>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold mb-3">Resolution Rate</h5>
                    <p className="display-6 text-success fw-bold mb-0">
                      {stats.total > 0 
                        ? Math.round(((stats.by_status?.resolved || 0) / stats.total) * 100) 
                        : 0}%
                    </p>
                    <p className="text-muted mb-0">Cases successfully resolved</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="feature-card p-4 h-100">
                    <h5 className="fw-bold mb-3">Avg. Resolution Time</h5>
                    <p className="display-6 text-info fw-bold mb-0">
                      {stats.avg_resolution_days || 0} <span className="fs-4">days</span>
                    </p>
                    <p className="text-muted mb-0">Average time to resolve</p>
                  </div>
                </div>
              </div>

              {stats.timeline && stats.timeline.length > 0 && (
                <div className="row g-4 mt-4">
                  <div className="col-12">
                    <div className="feature-card p-4 h-100">
                      <h5 className="fw-bold mb-3">Complaints Over Time (Last 30 Days)</h5>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Complaints</th>
                              <th>Bar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.timeline.slice(-10).map((item, index) => {
                              const maxCount = Math.max(...stats.timeline.map(t => t.count)) || 1;
                              const width = (item.count / maxCount) * 100;
                              return (
                                <tr key={index}>
                                  <td>{item.date}</td>
                                  <td>{item.count}</td>
                                  <td>
                                    <div className="progress" style={{ height: '20px' }}>
                                      <div 
                                        className="progress-bar bg-success" 
                                        style={{ width: `${width}%` }}
                                      >
                                        {item.count}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </>
  );
}

export default Reports;
