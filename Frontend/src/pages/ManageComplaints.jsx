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

  const fetchComplaints = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      
      // Prepare filters for API
      const apiFilters = {};
      if (filters.status) apiFilters.status = filters.status;
      if (filters.category_id) apiFilters.category_id = filters.category_id;
      if (filters.search) apiFilters.search = filters.search;
      if (filters.date_from) apiFilters.created_at_gte = filters.date_from;
      if (filters.date_to) apiFilters.created_at_lte = filters.date_to;
      
      const data = await api.getAdminComplaints(apiFilters);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setError(err.message || 'Failed to load complaints. Please try again.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
      await fetchComplaints(true);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update complaint status');
    }
  };

  const [assigningId, setAssigningId] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState({
    open: false,
    complaint: null,
    files: [],
    loading: false,
    error: '',
    info: '',
  });

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleShowEvidence = async (complaint) => {
    setEvidenceModal({
      open: true,
      complaint,
      files: [],
      loading: true,
      error: '',
      info: '',
    });

    try {
      const data = await api.getComplaintEvidence(complaint.id);
      const files = data.evidence || [];
      const fromBucket = data.source === 'storage' && files.length > 0;
      setEvidenceModal((prev) => ({
        ...prev,
        files,
        loading: false,
        error:
          data.setup_required && files.length === 0
            ? 'Evidence table missing in Supabase. Run backend/supabase/create-evidence-table.sql in SQL Editor, then: cd backend && npm run sync-evidence'
            : '',
        info:
          data.message ||
          (fromBucket
            ? `${files.length} file(s) loaded from Supabase storage bucket. Run create-evidence-table.sql + npm run sync-evidence to link them in the database.`
            : data.table_missing
              ? 'Evidence table not set up yet. Upload new files after running create-evidence-table.sql.'
              : ''),
      }));
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
      setEvidenceModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load evidence files',
      }));
    }
  };

  const closeEvidenceModal = () => {
    setEvidenceModal({
      open: false,
      complaint: null,
      files: [],
      loading: false,
      error: '',
      info: '',
    });
  };

  const handleDownloadEvidence = (file) => {
    if (!file?.signed_url) {
      setEvidenceModal((prev) => ({
        ...prev,
        error: `Download link unavailable for "${file?.file_name || 'file'}".`,
      }));
      return;
    }

    const link = document.createElement('a');
    link.href = file.signed_url;
    link.download = file.file_name || 'evidence-file';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOfficerOptions = (complaint) => {
    const options = [...officers];
    const assignedId = complaint.assigned_officer_id;
    const assignedOfficer = complaint.officer;

    if (assignedId && assignedOfficer && !options.some((o) => o.id === assignedId)) {
      options.unshift(assignedOfficer);
    }

    return options;
  };

  const handleAssignOfficer = async (complaintId, officerId) => {
    const previousComplaints = complaints;

    try {
      setAssigningId(complaintId);
      setError('');

      let response;
      if (!officerId) {
        response = await api.unassignOfficer(complaintId);
      } else {
        response = await api.assignOfficer(complaintId, officerId);
      }

      const updatedComplaint = response?.complaint;
      if (updatedComplaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, ...updatedComplaint } : c))
        );
      } else {
        await fetchComplaints(true);
      }
    } catch (err) {
      console.error('Failed to assign officer:', err);
      setError(err.message || 'Failed to assign officer');
      setComplaints(previousComplaints);
    } finally {
      setAssigningId(null);
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
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading complaints...</p>
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
                          disabled={assigningId === complaint.id}
                          style={{ minWidth: '180px' }}
                        >
                          <option value="">Unassigned</option>
                          {getOfficerOptions(complaint).map((officer) => (
                            <option key={officer.id} value={officer.id}>
                              {officer.full_name || officer.name} ({officer.workload?.total || 0} cases)
                            </option>
                          ))}
                        </select>
                        {complaint.officer && (
                          <small className="text-success d-block mt-1">
                            Assigned: {complaint.officer.full_name}
                          </small>
                        )}
                      </td>
                      <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleShowEvidence(complaint)}
                            title="Show Evidence"
                          >
                            <i className="bi bi-paperclip me-1"></i>
                            Evidence
                          </button>
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

        {evidenceModal.open && (
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-paperclip me-2"></i>
                    Evidence — {evidenceModal.complaint?.tracking_id}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeEvidenceModal} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-3">
                    <strong>{evidenceModal.complaint?.title}</strong>
                  </p>

                  {evidenceModal.error && (
                    <div className="alert alert-danger">{evidenceModal.error}</div>
                  )}

                  {evidenceModal.info && !evidenceModal.error && (
                    <div className="alert alert-info">{evidenceModal.info}</div>
                  )}

                  {evidenceModal.loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading evidence...</span>
                      </div>
                      <p className="mt-3 text-muted mb-0">Loading evidence files...</p>
                    </div>
                  ) : evidenceModal.files.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No evidence files uploaded for this complaint.
                    </div>
                  ) : (
                    <div className="list-group">
                      {evidenceModal.files.map((file) => (
                        <div
                          key={file.id || file.file_path}
                          className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                        >
                          <div>
                            <div className="fw-semibold">
                              <i className="bi bi-file-earmark me-2"></i>
                              {file.file_name}
                            </div>
                            <small className="text-muted">
                              {formatFileSize(file.file_size)} • {file.file_type || 'Unknown type'}
                            </small>
                          </div>
                          <div className="btn-group btn-group-sm">
                            {file.signed_url && (
                              <a
                                href={file.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary"
                                title="View"
                              >
                                <i className="bi bi-eye me-1"></i>
                                View
                              </a>
                            )}
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleDownloadEvidence(file)}
                              disabled={!file.signed_url}
                              title="Download"
                            >
                              <i className="bi bi-download me-1"></i>
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEvidenceModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export default ManageComplaints;
