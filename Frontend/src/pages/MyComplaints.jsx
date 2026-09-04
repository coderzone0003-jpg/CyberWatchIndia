import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatOfficerSummary, getAssignedOfficer } from '../utils/officerDisplay';

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  useEffect(() => {
    fetchComplaints();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

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
      apiFilters.limit = itemsPerPage;
      apiFilters.offset = (currentPage - 1) * itemsPerPage;

      const data = await api.getMyComplaints(apiFilters);
      const rawComplaints = data.complaints || [];
      const sortedComplaints = [...rawComplaints].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setComplaints(sortedComplaints);
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setError('Failed to load complaints. Please try again.');
      setComplaints([]);
      setTotalItems(0);
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category_id: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-secondary';
      case 'under investigation': return 'bg-warning text-dark';
      case 'resolved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'closed': return 'bg-dark';
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <section className="section py-5">
      <div className="container">
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">My Complaints</h4>
            <Link className="btn btn-success btn-sm" to="/report">
              <i className="bi bi-plus-circle me-1"></i>New Complaint
            </Link>
          </div>

          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
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
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label className="form-label small">Search</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by ID, title..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading your complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-3"></i>
              <p className="mb-3">No complaints found</p>
              <Link className="btn btn-success" to="/report">
                File Your First Complaint
              </Link>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Assigned Officer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>
                          <Link
                            to={`/complaint-details?id=${complaint.id}`}
                            className="text-decoration-none fw-semibold"
                          >
                            {complaint.tracking_id}
                          </Link>
                        </td>
                        <td>{complaint.title}</td>
                        <td>{complaint.category?.name || 'N/A'}</td>
                        <td>
                          {getAssignedOfficer(complaint) ? (
                            <span className="text-success fw-semibold small">
                              {formatOfficerSummary(complaint)}
                            </span>
                          ) : (
                            <span className="text-muted small">Not assigned yet</span>
                          )}
                        </td>
                        <td>{formatDate(complaint.created_at)}</td>
                        <td>
                          <span className={`badge ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="btn btn-sm btn-outline-success"
                            to={`/complaint-details?id=${complaint.id}`}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}

              <div className="text-center text-muted small mt-3">
                Showing {complaints.length} of {totalItems} complaints
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default MyComplaints;
