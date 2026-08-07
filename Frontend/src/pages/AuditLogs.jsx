import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });
  
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    search: ''
  });

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.offset]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      params.limit = pagination.limit;
      params.offset = pagination.offset;

      const data = await api.getAuditLogs(params);
      setLogs(data.logs || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const getActionBadge = (action) => {
    const badgeStyles = {
      'USER_REGISTERED': 'bg-success',
      'USER_LOGIN': 'bg-info',
      'USER_LOGOUT': 'bg-secondary',
      'COMPLAINT_CREATED': 'bg-primary',
      'COMPLAINT_UPDATED': 'bg-warning',
      'COMPLAINT_DELETED': 'bg-danger',
      'OFFICER_ASSIGNED': 'bg-info',
      'STATUS_CHANGED': 'bg-warning',
      'EVIDENCE_DELETED': 'bg-danger',
      'CATEGORY_CREATED': 'bg-success',
      'CATEGORY_UPDATED': 'bg-warning',
      'CATEGORY_DELETED': 'bg-danger'
    };
    return badgeStyles[action] || 'bg-secondary';
  };

  const formatDetails = (details) => {
    if (!details) return 'N/A';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  };

  if (loading) {
    return (
      <section className="section py-4">
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading audit logs...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section py-4">
      <div className="container-fluid">
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}
        
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Audit Logs</h4>
            <button className="btn btn-success" onClick={fetchAuditLogs}>
              <i className="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-2">
              <label className="form-label small">Action</label>
              <select
                className="form-select form-select-sm"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <option value="USER_REGISTERED">User Registered</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="COMPLAINT_CREATED">Complaint Created</option>
                <option value="COMPLAINT_UPDATED">Complaint Updated</option>
                <option value="OFFICER_ASSIGNED">Officer Assigned</option>
                <option value="STATUS_CHANGED">Status Changed</option>
                <option value="EVIDENCE_DELETED">Evidence Deleted</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Entity Type</label>
              <select
                className="form-select form-select-sm"
                name="entity_type"
                value={filters.entity_type}
                onChange={handleFilterChange}
              >
                <option value="">All Entities</option>
                <option value="user">User</option>
                <option value="complaint">Complaint</option>
                <option value="evidence">Evidence</option>
                <option value="category">Category</option>
              </select>
            </div>
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
              <label className="form-label small">Search</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search..."
              />
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
          
          {/* Logs Table */}
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No audit logs found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <small>{new Date(log.created_at).toLocaleString()}</small>
                      </td>
                      <td>
                        <strong>{log.user_profile?.full_name || log.user_profile?.name || 'Unknown'}</strong>
                        <br/>
                        <small className="text-muted">{log.user_profile?.email || 'N/A'}</small>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong>{log.entity_type}</strong>
                        {log.entity_id && <small className="text-muted d-block">ID: {log.entity_id}</small>}
                      </td>
                      <td>
                        <small>{log.ip_address || 'N/A'}</small>
                      </td>
                      <td>
                        <small className="text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatDetails(log.details)}
                        </small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
              </small>
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AuditLogs;