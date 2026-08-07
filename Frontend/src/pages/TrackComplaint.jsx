import React, { useState } from 'react';
import { api } from '../utils/api';

const stages = ['Submitted', 'Under Review', 'Assigned Officer', 'Investigation', 'Resolved'];

function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setComplaint(null);
    setEvidence([]);
    setNotFound(false);
    setSearching(true);
    setLoading(true);

    if (!complaintId.trim()) {
      setError('Please enter a complaint ID');
      setSearching(false);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getComplaintByNumber(complaintId.trim());
      setComplaint(data);
      setNotFound(false);
      
      // Fetch evidence files
      if (data && data.id) {
        fetchEvidence(data.id);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Complaint not found. Please check the ID and try again.');
      setNotFound(true);
      setComplaint(null);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const fetchEvidence = async (complaintId) => {
    setLoadingEvidence(true);
    try {
      const data = await api.getComplaintEvidence(complaintId);
      setEvidence(data.evidence || []);
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
      // Don't fail the whole operation if evidence fetch fails
      setEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const getStatusStep = (status) => {
    const statusMap = {
      'pending': 0,
      'under investigation': 2,
      'resolved': 4,
      'closed': 4,
      'rejected': 4
    };
    return statusMap[status] || 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClear = () => {
    setComplaintId('');
    setComplaint(null);
    setEvidence([]);
    setError('');
    setNotFound(false);
  };

  return (
    <section className="section py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-6">
            <span className="section-label">Track Complaint</span>
            <h2 className="fw-bold mt-3">Monitor your case progress</h2>
            <p className="text-muted">Enter your complaint ID to review current status, assigned officer, and investigation timeline.</p>
            
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <div className="contact-form p-4 rounded-4 shadow-sm">
              <label className="form-label">Complaint ID</label>
              <div className="input-group mb-3">
                <input 
                  className="form-control" 
                  placeholder="Enter ID (e.g., CYB-2024-00001)" 
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                />
                {complaintId && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
              <button 
                className="btn btn-success w-100" 
                onClick={handleSearch}
                disabled={loading || !complaintId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Search Complaint
                  </>
                )}
              </button>
            </div>

            <div className="mt-4">
              <h6 className="fw-bold mb-2">Tips for finding your complaint:</h6>
              <ul className="small text-muted">
                <li>Enter the complete tracking ID you received when filing</li>
                <li>Format is typically: CYB-YYYY-XXXXX (e.g., CYB-2024-00001)</li>
                <li>Check your email for the confirmation with the tracking ID</li>
                <li>Contact helpline 1930 if you've lost your tracking ID</li>
              </ul>
            </div>
          </div>
          
          <div className="col-lg-6">
            {searching ? (
              <div className="contact-form p-4 rounded-4 shadow-sm">
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Searching for your complaint...</p>
                </div>
              </div>
            ) : complaint ? (
              <div className="contact-form p-4 rounded-4 shadow-sm">
                <h4 className="fw-bold mb-3">Case Details</h4>
                <div className="alert alert-info mb-3">
                  <p className="mb-1"><strong>Complaint ID:</strong> {complaint.tracking_id}</p>
                  <p className="mb-1"><strong>Title:</strong> {complaint.title}</p>
                  <p className="mb-1"><strong>Category:</strong> {complaint.category || 'N/A'}</p>
                  <p className="mb-1"><strong>Status:</strong> 
                    <span className={`badge ms-2 ${
                      complaint.status === 'resolved' ? 'bg-success' :
                      complaint.status === 'under investigation' ? 'bg-warning' :
                      complaint.status === 'pending' ? 'bg-secondary' : 'bg-danger'
                    }`}>
                      {complaint.status}
                    </span>
                  </p>
                  <p className="mb-0"><strong>Submitted On:</strong> {formatDate(complaint.created_at)}</p>
                </div>
                
                {evidence.length > 0 && (
                  <div className="mb-3">
                    <h5 className="fw-bold mb-2">Evidence Files</h5>
                    {loadingEvidence ? (
                      <div className="text-center py-2">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Loading evidence...
                      </div>
                    ) : (
                      <div className="list-group">
                        {evidence.map((file, index) => (
                          <a
                            key={index}
                            href={file.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <i className="bi bi-file-earmark me-2"></i>
                              {file.file_name}
                              <small className="text-muted d-block ms-4">
                                {(file.file_size / 1024).toFixed(2)} KB • {file.file_type}
                              </small>
                            </div>
                            <i className="bi bi-download"></i>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <h5 className="fw-bold mb-3">Case Timeline</h5>
                <div className="mt-4">
                  {stages.map((stage, index) => (
                    <div key={stage} className="d-flex align-items-center mb-2">
                      <div className={`status-dot ${index <= getStatusStep(complaint.status) ? 'active' : ''}`}></div>
                      <span className="ms-2">{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : notFound ? (
              <div className="contact-form p-4 rounded-4 shadow-sm">
                <div className="text-center py-4">
                  <i className="bi bi-search display-4 mb-3 text-muted"></i>
                  <h5 className="fw-bold mb-2">Complaint Not Found</h5>
                  <p className="text-muted mb-3">
                    We couldn't find a complaint with ID: <strong>{complaintId}</strong>
                  </p>
                  <button className="btn btn-outline-secondary btn-sm" onClick={handleClear}>
                    Try Different ID
                  </button>
                </div>
              </div>
            ) : (
              <div className="contact-form p-4 rounded-4 shadow-sm">
                <h4 className="fw-bold mb-3">Case Timeline</h4>
                <div className="text-center text-muted py-5">
                  <i className="bi bi-search display-4 mb-3"></i>
                  <p>Enter a complaint ID to track its status</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrackComplaint;