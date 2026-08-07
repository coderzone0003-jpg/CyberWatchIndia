import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    search: '',
    date_from: '',
    date_to: ''
  });
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    fetchComplaints();
    fetchCategories();
    fetchOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchOfficers = async () => {
    try {
      const data = await api.getAdminOfficers();
      setOfficers(data);
    } catch (err) {
      console.error('Failed to fetch officers:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare filters for API
      const apiFilters = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.category_id) apiFilters.category_id = filters.category_id;
      if (filters.search) apiFilters.search = filters.search;
      if (filters.date_from) apiFilters.created_at_gte = filters.date_from;
      if (filters.date_to) apiFilters.created_at_lte = filters.date_to;
      
      const data = await api.getAdminComplaints(apiFilters);
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getComplaintCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await api.updateComplaintStatus(complaintId, newStatus);
      // Refresh the list
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update complaint status');
    }
  };

  const handleAssignOfficer = async (complaintId, officerId) => {
    try {
      await api.assignOfficer(complaintId, officerId);
      // Refresh the list
      fetchComplaints();
    } catch (err) {
      console.error('Failed to assign officer:', err);
      setError('Failed to assign officer');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'bg-warning text-dark',
      'under investigation': 'bg-info text-dark',
      'resolved': 'bg-success',
      'rejected': 'bg-danger',
      'closed': 'bg-secondary'
    };
    return statusMap[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <section className="section py-4">
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading complaints...</p>
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
            <h4 className="fw-bold mb-0">Manage Complaints</h4>
            <div className="d-flex gap-2">
              <input 
                className="form-control" 
                placeholder="Search complaint..." 
                name="search"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <select 
                className="form-select"
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
              <select 
                className="form-select"
                name="category_id"
                value={filters.category_id}
                onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input 
                type="date"
                className="form-control"
                placeholder="From Date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
              <input 
                type="date"
                className="form-control"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setFilters({ status: '', category_id: '', search: '', date_from: '', date_to: '' })}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No complaints found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>
                        <strong>{complaint.tracking_id}</strong>
                      </td>
                      <td>{complaint.title}</td>
                      <td>{complaint.category?.name || 'N/A'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={complaint.assigned_officer_id || ''}
                          onChange={(e) => handleAssignOfficer(complaint.id, e.target.value)}
                          style={{ minWidth: '150px' }}
                        >
                          <option value="">Unassigned</option>
                          {officers.map(officer => (
                            <option key={officer.id} value={officer.id}>
                              {officer.full_name || officer.name} ({officer.workload?.total || 0} cases)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange(complaint.id, 'under investigation')}
                            title="Start Investigation"
                          >
                            <i className="bi bi-play-circle"></i>
                          </button>
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleStatusChange(complaint.id, 'resolved')}
                            title="Mark Resolved"
                          >
                            <i className="bi bi-check-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {complaints.length > 0 && (
            <div className="mt-3 text-muted">
              Showing {complaints.length} complaint(s)
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ManageComplaints;
