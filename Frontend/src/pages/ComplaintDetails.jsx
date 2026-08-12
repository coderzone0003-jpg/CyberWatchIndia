import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { getAssignedOfficer } from '../utils/officerDisplay';
import { getUserSession } from '../utils/authStorage';

function ComplaintDetails() {
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get('id');
  
  const [complaint, setComplaint] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const user = getUserSession();
    if (user) {
      setAuthUser(user);
    }
  }, []);

  useEffect(() => {
    if (complaintId) {
      fetchComplaintDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.getComplaintById(complaintId);
      setComplaint(data);
      
      // Fetch evidence files
      const evidenceData = await api.getComplaintEvidence(complaintId);
      setEvidence(evidenceData.evidence || []);
    } catch (err) {
      console.error('Failed to fetch complaint details:', err);
      setError('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await api.deleteEvidence(complaintId, evidenceId);
      // Refresh evidence list
      const evidenceData = await api.getComplaintEvidence(complaintId);
      setEvidence(evidenceData.evidence || []);
    } catch (err) {
      console.error('Failed to delete evidence:', err);
      setError('Failed to delete evidence file');
    }
  };

  const canDeleteEvidence = (complaintStatus) => {
    // Users can only delete evidence from pending complaints
    // Admins can delete from any complaint
    if (authUser?.role === 'admin') return true;
    if (authUser?.role === 'officer') return true;
    if (authUser?.role === 'user' && complaintStatus === 'pending') return true;
    return false;
  };

  if (loading) {
    return (
      <section className="section py-5">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading complaint details...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section py-5">
        <div className="container">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </section>
    );
  }

  if (!complaint) {
    return (
      <section className="section py-5">
        <div className="container">
          <div className="alert alert-warning" role="alert">
            Complaint not found
          </div>
        </div>
      </section>
    );
  }

  const assignedOfficer = getAssignedOfficer(complaint);

  return (
    <section className="section py-5">
      <div className="container">
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Complaint Details</h4>
            <span className={`badge ${complaint.status === 'resolved' ? 'bg-success' : complaint.status === 'under investigation' ? 'bg-warning' : 'bg-secondary'}`}>
              {complaint.status}
            </span>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <p><strong>Tracking ID:</strong> {complaint.tracking_id}</p>
              <p><strong>Title:</strong> {complaint.title}</p>
              <p><strong>Category:</strong> {complaint.category?.name || 'N/A'}</p>
              <p><strong>Severity:</strong> 
                <span className={`badge ms-2 ${
                  complaint.severity === 'critical' ? 'bg-danger' :
                  complaint.severity === 'high' ? 'bg-warning' :
                  complaint.severity === 'medium' ? 'bg-info' : 'bg-success'
                }`}>
                  {complaint.severity}
                </span>
              </p>
            </div>
            <div className="col-md-6">
              <p><strong>Submitted On:</strong> {new Date(complaint.created_at).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(complaint.updated_at).toLocaleString()}</p>
              <p><strong>Location:</strong> {complaint.location || 'N/A'}</p>
              <p><strong>Incident Date:</strong> {complaint.incident_date || 'N/A'}</p>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-person-badge me-2 text-success"></i>
              Assigned Investigating Officer
            </h5>
            {assignedOfficer ? (
              <div className="border rounded-3 p-3 bg-light">
                <p className="mb-1"><strong>Name:</strong> {assignedOfficer.full_name}</p>
                {assignedOfficer.badge_number && (
                  <p className="mb-1"><strong>Badge Number:</strong> {assignedOfficer.badge_number}</p>
                )}
                {assignedOfficer.specialization && (
                  <p className="mb-1"><strong>Specialization:</strong> {assignedOfficer.specialization}</p>
                )}
                {assignedOfficer.phone && (
                  <p className="mb-1"><strong>Contact:</strong> {assignedOfficer.phone}</p>
                )}
                {assignedOfficer.email && (
                  <p className="mb-0"><strong>Email:</strong> {assignedOfficer.email}</p>
                )}
              </div>
            ) : (
              <div className="alert alert-secondary mb-0">
                No officer has been assigned to this case yet. You will be notified once an officer is assigned.
              </div>
            )}
          </div>

          <div className="mb-4">
            <h5 className="fw-bold mb-3">Description</h5>
            <p className="text-muted">{complaint.description}</p>
          </div>

          <div className="mb-4">
            <h5 className="fw-bold mb-3">Evidence Files</h5>
            {evidence.length === 0 ? (
              <p className="text-muted">No evidence files attached</p>
            ) : (
              <div className="list-group">
                {evidence.map((file) => (
                  <div key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-file-earmark me-2"></i>
                      {file.file_name}
                      <small className="text-muted d-block ms-4">
                        {(file.file_size / 1024).toFixed(2)} KB • {file.file_type}
                      </small>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <a
                        href={file.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary"
                        title="Download"
                      >
                        <i className="bi bi-download"></i>
                      </a>
                      {canDeleteEvidence(complaint.status) && (
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteEvidence(file.id, file.file_name)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert alert-info mb-0">
            <small>
              <i className="bi bi-info-circle me-2"></i>
              {complaint.status === 'pending' && 'You can delete evidence files while the complaint is pending.'}
              {complaint.status !== 'pending' && 'Evidence files cannot be deleted once the complaint is under investigation.'}
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComplaintDetails;