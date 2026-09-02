import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ManageOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer',
    specialization: '',
    badge_number: ''
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.getAdminOfficers();
      setOfficers(data);
    } catch (err) {
      console.error('Failed to fetch officers:', err);
      setError(err.message || 'Failed to load officers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    
    try {
      await api.createOfficer(newOfficer);
      setShowAddModal(false);
      setNewOfficer({
        name: '',
        email: '',
        password: '',
        role: 'officer',
        specialization: '',
        badge_number: ''
      });
      setError('');
      fetchOfficers();
    } catch (err) {
      console.error('Failed to create officer:', err);
      setError(err.message || 'Failed to create officer. Please try again.');
    }
  };

  const handleDeleteOfficer = async (officerId, officerName) => {
    if (!window.confirm(`Are you sure you want to delete officer "${officerName}"?`)) {
      return;
    }

    try {
      await api.deleteOfficer(officerId);
      setError('');
      fetchOfficers();
    } catch (err) {
      console.error('Failed to delete officer:', err);
      setError(err.message || 'Failed to delete officer. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOfficer(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading officers...</p>
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
            <h4 className="fw-bold mb-0">Officer Management</h4>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
            >
              Add Officer
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Badge Number</th>
                  <th>Workload</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No officers found. Click "Add Officer" to create one.
                    </td>
                  </tr>
                ) : (
                  officers.map((officer) => (
                    <tr key={officer.id}>
                      <td>
                        <strong>{officer.full_name || officer.name}</strong>
                      </td>
                      <td>{officer.email}</td>
                      <td>{officer.specialization || 'N/A'}</td>
                      <td>{officer.badge_number || 'N/A'}</td>
                      <td>
                        {officer.workload ? (
                          <div>
                            <span className="badge bg-primary me-1">
                              {officer.workload.total} Total
                            </span>
                            <div className="small text-muted mt-1">
                              <span className="badge bg-warning text-dark me-1">{officer.workload.pending} Pending</span>
                              <span className="badge bg-info text-dark me-1">{officer.workload.investigation} Active</span>
                              <span className="badge bg-success">{officer.workload.resolved} Resolved</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">No workload data</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${officer.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {officer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteOfficer(officer.id, officer.full_name || officer.name)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {officers.length > 0 && (
            <div className="mt-3 text-muted">
              Showing {officers.length} officer(s)
            </div>
          )}
        </div>

        {/* Add Officer Modal */}
        {showAddModal && (
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Officer</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddOfficer}>
                    <div className="mb-3">
                      <label className="form-label">Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="name"
                        value={newOfficer.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email *</label>
                      <input 
                        type="email" 
                        className="form-control"
                        name="email"
                        value={newOfficer.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Specialization</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="specialization"
                        value={newOfficer.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g., Cyber Forensics, Network Security"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Badge Number</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="badge_number"
                        value={newOfficer.badge_number}
                        onChange={handleInputChange}
                        placeholder="e.g., OFF-1234"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Temporary Password *</label>
                      <input 
                        type="password" 
                        className="form-control"
                        name="password"
                        value={newOfficer.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Officer will change this on first login"
                      />
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowAddModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success">
                        Add Officer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export default ManageOfficers;