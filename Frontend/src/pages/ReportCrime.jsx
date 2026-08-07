import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function ReportCrime() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    title: '',
    category_id: '',
    incident_date: '',
    location: '',
    description: '',
    evidence: []
  });
  
  const [categories, setCategories] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getComplaintCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count (max 5)
    if (uploadedFiles.length + files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    const typeValidFiles = validFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has invalid type. Allowed: images, PDF, text`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...typeValidFiles]);
    setFormData(prev => ({ 
      ...prev, 
      evidence: [...prev.evidence, ...typeValidFiles] 
    }));
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFormData(prev => ({ 
      ...prev, 
      evidence: newFiles 
    }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.mobile) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.title || formData.title.length < 10) {
      setError('Title must be at least 10 characters');
      return false;
    }
    if (!formData.category_id) {
      setError('Please select a crime category');
      return false;
    }
    if (!formData.description || formData.description.length < 20) {
      setError('Description must be at least 20 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    
    if (step < 4) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create FormData for file upload
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('description', formData.description);
      submissionData.append('category_id', formData.category_id);
      submissionData.append('severity', 'medium');
      submissionData.append('location', formData.location);
      submissionData.append('incident_date', formData.incident_date);

      // Add files with progress tracking
      const uploadPromises = uploadedFiles.map((file, index) => {
        return new Promise((resolve, reject) => {
          submissionData.append('evidence', file);
          resolve();
        });
      });

      await Promise.all(uploadPromises);

      const response = await api.createComplaint(submissionData);

      setComplaintId(response.complaint.tracking_id);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewComplaint = () => {
    setSuccess(false);
    setComplaintId('');
    setStep(1);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      address: '',
      title: '',
      category_id: '',
      incident_date: '',
      location: '',
      description: '',
      evidence: []
    });
    setUploadedFiles([]);
  };

  const handleTrackComplaint = () => {
    navigate('/track');
  };

  if (success) {
    return (
      <section className="section py-5">
        <div className="container">
          <div className="text-center mb-4">
            <div className="display-1 text-success mb-3">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 className="fw-bold">Complaint Submitted Successfully</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="contact-form p-5 rounded-4 shadow-sm text-center">
                <div className="alert alert-success mb-4">
                  <h4 className="alert-heading">Your Complaint ID</h4>
                  <h2 className="display-4 fw-bold">{complaintId}</h2>
                  <p className="mb-0">Please save this ID for tracking your complaint status</p>
                </div>
                <p className="text-muted mb-4">
                  You can track your complaint status using this ID. Our team will review your complaint and contact you if additional information is needed.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <button className="btn btn-success" onClick={handleTrackComplaint}>
                    Track Complaint
                  </button>
                  <button className="btn btn-outline-success" onClick={handleNewComplaint}>
                    File Another Complaint
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="section-label">Official Complaint Filing</span>
          <h2 className="fw-bold mt-3">File a complaint in four secure steps</h2>
        </div>
        
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="feature-card p-4 h-100">
              <h5 className="fw-bold">Step {step} of 4</h5>
              <p className="text-muted">Secure, guided reporting for citizens and institutions.</p>
              
              {/* Progress indicator */}
              <div className="mt-4">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s} 
                    className={`progress-step mb-2 ${s <= step ? 'active' : ''}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: s <= step ? '#16A34A' : '#e9ecef',
                      color: s <= step ? 'white' : '#6c757d',
                      fontSize: '14px',
                      fontWeight: s === step ? '600' : '400'
                    }}
                  >
                    {s === 1 && 'Personal Information'}
                    {s === 2 && 'Incident Details'}
                    {s === 3 && 'Evidence Upload'}
                    {s === 4 && 'Review & Submit'}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-lg-8">
            <form className="contact-form p-4 rounded-4 shadow-sm" onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input 
                      className="form-control" 
                      placeholder="Citizen name" 
                      value={formData.name}
                      onChange={handleInputChange}
                      name="name"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="citizen@email.com" 
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mobile Number *</label>
                    <input 
                      className="form-control" 
                      placeholder="Phone number" 
                      value={formData.mobile}
                      onChange={handleInputChange}
                      name="mobile"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address</label>
                    <input 
                      className="form-control" 
                      placeholder="Residential address" 
                      value={formData.address}
                      onChange={handleInputChange}
                      name="address"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Complaint Title *</label>
                    <input 
                      className="form-control" 
                      placeholder="Brief title for your complaint" 
                      value={formData.title}
                      onChange={handleInputChange}
                      name="title"
                      disabled={loading}
                      required
                      minLength={10}
                    />
                    <small className="text-muted">Minimum 10 characters</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Crime Category *</label>
                    <select 
                      className="form-select"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      name="category_id"
                      disabled={loading}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Incident Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.incident_date}
                      onChange={handleInputChange}
                      name="incident_date"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Location</label>
                    <input 
                      className="form-control" 
                      placeholder="City / State" 
                      value={formData.location}
                      onChange={handleInputChange}
                      name="location"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description *</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      placeholder="Describe the incident in detail (minimum 20 characters)"
                      value={formData.description}
                      onChange={handleInputChange}
                      name="description"
                      disabled={loading}
                      required
                      minLength={20}
                    />
                    <small className="text-muted">{formData.description.length}/20 characters minimum</small>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Upload Evidence (max 5 files, 10MB each)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      multiple
                      onChange={handleFileChange}
                      disabled={loading}
                      accept="image/*,.pdf,.txt"
                    />
                    <small className="text-muted">Allowed: Images, PDF, Text files</small>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Selected Files:</label>
                      <div className="list-group">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <i className="bi bi-file-earmark me-2"></i>
                              {file.name}
                              <small className="text-muted d-block ms-4">
                                {(file.size / 1024).toFixed(2)} KB
                              </small>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="col-12">
                    <label className="form-label">Additional Notes</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Attach screenshots, receipts, or chat logs"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              
              {step === 4 && (
                <div>
                  <h5 className="fw-bold mb-3">Review Complaint Details</h5>
                  <div className="alert alert-info">
                    <h6 className="alert-heading">Personal Information</h6>
                    <p className="mb-1"><strong>Name:</strong> {formData.name}</p>
                    <p className="mb-1"><strong>Email:</strong> {formData.email}</p>
                    <p className="mb-1"><strong>Mobile:</strong> {formData.mobile}</p>
                    <p className="mb-0"><strong>Address:</strong> {formData.address || 'Not provided'}</p>
                  </div>
                  
                  <div className="alert alert-info">
                    <h6 className="alert-heading">Incident Details</h6>
                    <p className="mb-1"><strong>Title:</strong> {formData.title}</p>
                    <p className="mb-1"><strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}</p>
                    <p className="mb-1"><strong>Date:</strong> {formData.incident_date || 'Not provided'}</p>
                    <p className="mb-1"><strong>Location:</strong> {formData.location || 'Not provided'}</p>
                    <p className="mb-0"><strong>Description:</strong> {formData.description}</p>
                  </div>
                  
                  <div className="alert alert-info">
                    <h6 className="alert-heading">Evidence Files</h6>
                    {uploadedFiles.length > 0 ? (
                      <ul className="mb-0">
                        {uploadedFiles.map((file, index) => (
                          <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-0">No files uploaded</p>
                    )}
                  </div>
                  
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Important:</strong> Your complaint will be assigned a secure Complaint ID after submission. Please save it for tracking.
                  </div>
                  
                  <button 
                    className="btn btn-success px-4" 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Complaint'
                    )}
                  </button>
                </div>
              )}
              
              <div className="d-flex justify-content-between mt-4">
                <button 
                  className="btn btn-outline-success" 
                  type="button" 
                  onClick={handlePrevious}
                  disabled={step === 1 || loading}
                >
                  Previous
                </button>
                {step < 4 ? (
                  <button 
                    className="btn btn-success" 
                    type="button" 
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReportCrime;
