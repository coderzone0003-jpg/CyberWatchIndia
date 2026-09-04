import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { sanitizeMobileInput, validateIndianMobile } from '../utils/phoneValidation';

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
    severity: 'medium',
    evidence: []
  });
  
  const [categories, setCategories] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setShowLocationModal(false);
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const placeName = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, location: placeName }));
          setLocationStatus('Location detected successfully via GPS!');
        } catch {
          setFormData(prev => ({ ...prev, location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` }));
          setLocationStatus('GPS coordinates captured successfully!');
        } finally {
          setLocationLoading(false);
          setShowLocationModal(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationLoading(false);
        setShowLocationModal(false);
        setError('Location permission denied or unavailable. Please enter your location manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getComplaintCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'mobile' ? sanitizeMobileInput(value) : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setError('');

    if (uploadedFiles.length + files.length > 5) {
      setError('Maximum 5 evidence files are allowed.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'];
    const validFiles = [];

    for (const file of files) {
      if (file.size === 0) {
        setError(`File "${file.name}" is empty (0 bytes) and cannot be uploaded.`);
        continue;
      }
      if (file.size > maxSize) {
          setError(`File "${file.name}" exceeds the 10 MB size limit.`);
          continue;
      }
      const typeOk = allowedTypes.includes(file.type) ||
        allowedExts.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!typeOk) {
        setError(`File "${file.name}" has an invalid type. Allowed: JPG, PNG, GIF, PDF, TXT.`);
        continue;
      }
      const dangerousNames = /[<>:"/\\|?*]/;
      if (dangerousNames.test(file.name)) {
          setError(`File "${file.name}" contains invalid characters in its name.`);
          continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0 && files.length > 0 && !error) {
      setError('No valid files were selected.');
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...validFiles]
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

  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const validateStep1 = () => {
    const errors = {};
    let valid = true;

    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Full name is required.';
      valid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
      valid = false;
    } else if (formData.name.trim().length > 255) {
      errors.name = 'Name cannot exceed 255 characters.';
      valid = false;
    } else if (!/^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s'.-]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters, spaces, hyphens, apostrophes, and dots.';
      valid = false;
    }

    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = 'Email address is required.';
      valid = false;
    } else if (formData.email.length > 255) {
      errors.email = 'Email is too long (max 255 characters).';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      errors.email = 'Enter a valid email (e.g. name@example.com).';
      valid = false;
    }

    const mobileCheck = validateIndianMobile(formData.mobile);
    if (!mobileCheck.valid) {
      errors.mobile = mobileCheck.error;
      valid = false;
    }

    if (formData.address && formData.address.trim().length > 0) {
      if (formData.address.trim().length < 5) {
        errors.address = 'Address, if provided, must be at least 5 characters.';
        valid = false;
      } else if (formData.address.length > 500) {
        errors.address = 'Address cannot exceed 500 characters.';
        valid = false;
      } else if (/[<>]/.test(formData.address)) {
        errors.address = 'Address cannot contain < or > characters.';
        valid = false;
      }
    }

    setFieldErrors(errors);
    if (!valid) {
      const firstMsg = Object.values(errors)[0];
      setError(firstMsg);
    } else {
      setError('');
    }
    return valid;
  };

  const validateStep2 = () => {
    const errors = {};
    let valid = true;

    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = 'Complaint title is required.';
      valid = false;
    } else if (formData.title.trim().length < 10) {
      errors.title = `Title is too short (${formData.title.trim().length}/10 characters minimum).`;
      valid = false;
    } else if (formData.title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters.';
      valid = false;
    } else if (/^[\W\d_]+$/.test(formData.title.trim())) {
      errors.title = 'Title must contain descriptive text, not just symbols or numbers.';
      valid = false;
    }

    if (!formData.category_id) {
      errors.category_id = 'Please select a crime category.';
      valid = false;
    }

    if (formData.incident_date) {
      const selected = new Date(formData.incident_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(selected.getTime())) {
        errors.incident_date = 'Please provide a valid incident date.';
        valid = false;
      } else if (selected > today) {
        errors.incident_date = 'Incident date cannot be in the future.';
        valid = false;
      } else {
        const oldest = new Date();
        oldest.setFullYear(oldest.getFullYear() - 50);
        if (selected < oldest) {
          errors.incident_date = 'Incident date is too far in the past.';
          valid = false;
        }
      }
    }

    if (formData.location && formData.location.trim().length > 0) {
      if (formData.location.trim().length < 2) {
        errors.location = 'Location must be at least 2 characters if provided.';
        valid = false;
      } else if (formData.location.length > 255) {
        errors.location = 'Location cannot exceed 255 characters.';
        valid = false;
      }
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'Incident description is required.';
      valid = false;
    } else if (formData.description.trim().length < 20) {
      errors.description = `Description is too short (${formData.description.trim().length}/20 characters minimum). Please provide sufficient details.`;
      valid = false;
    } else if (formData.description.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters.';
      valid = false;
    } else {
      const uniqueWords = formData.description.trim().split(/\s+/).filter(w => w.length > 1).length;
      if (uniqueWords < 5) {
        errors.description = 'Description must contain at least 5 meaningful words.';
        valid = false;
      }
    }

    if (formData.severity && !['low', 'medium', 'high', 'critical'].includes(formData.severity)) {
      errors.severity = 'Invalid severity selection.';
      valid = false;
    }

    setFieldErrors(errors);
    if (!valid) {
      const firstMsg = Object.values(errors)[0];
      setError(firstMsg);
    } else {
      setError('');
    }
    return valid;
  };

  const validateStep3 = () => {
    const errors = {};
    let valid = true;

    if (uploadedFiles.length > 5) {
      errors.evidence = 'You cannot upload more than 5 files.';
      valid = false;
    }

    const maxSize = 10 * 1024 * 1024;
    let totalSize = 0;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'];

    for (const file of uploadedFiles) {
      totalSize += file.size;
      if (file.size === 0) {
        errors.evidence = `File "${file.name}" is empty.`;
        valid = false;
        break;
      }
      if (file.size > maxSize) {
        errors.evidence = `File "${file.name}" is larger than 10 MB.`;
        valid = false;
        break;
      }
      const typeOk = allowedTypes.includes(file.type) ||
        allowedExts.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!typeOk) {
        errors.evidence = `File "${file.name}" has a disallowed type. Allowed: JPG, PNG, GIF, PDF, TXT.`;
        valid = false;
        break;
      }
    }

    if (totalSize > 50 * 1024 * 1024) {
      errors.evidence = 'Total evidence files cannot exceed 50 MB combined.';
      valid = false;
    }

    setFieldErrors(errors);
    if (!valid) {
      const firstMsg = Object.values(errors)[0];
      setError(firstMsg);
    } else {
      setError('');
    }
    return valid;
  };

  const validateStep4 = () => {
    return validateStep1() && validateStep2() && validateStep3();
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    if (step < 4) {
      setFieldErrors({});
      setStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    setFieldErrors({});
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateStep4()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const submissionData = new FormData();
      submissionData.append('title', formData.title.trim());
      submissionData.append('description', formData.description.trim());
      submissionData.append('category_id', formData.category_id);
      submissionData.append('severity', formData.severity || 'medium');
      submissionData.append('location', formData.location ? formData.location.trim() : '');
      submissionData.append('incident_date', formData.incident_date || '');

      uploadedFiles.forEach((file) => {
        submissionData.append('evidence', file);
      });

      const response = await api.createComplaint(submissionData);

      setComplaintId(response.complaint.tracking_id);
      setSuccess(true);
      setError('');
      setFieldErrors({});
    } catch (err) {
      console.error('Complaint submission error:', err);
      let message = err.message || 'Failed to submit complaint. Please try again.';
      if (err.errors && Array.isArray(err.errors)) {
        const first = err.errors[0];
        if (first && first.message) message = first.message;
        if (first && first.field) setFieldError(first.field, first.message);
      }
      setError(message);
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
      severity: 'medium',
      evidence: []
    });
    setUploadedFiles([]);
    setError('');
    setFieldErrors({});
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
            <h2 className="fw-bold">Complaint Submitted Securely</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="contact-form p-5 rounded-4 shadow-sm text-center">
                <div className="alert alert-success mb-4">
                  <h4 className="alert-heading">Your Secure Complaint ID</h4>
                  <h2 className="display-4 fw-bold user-select-all">{complaintId}</h2>
                  <p className="mb-0">Please save this ID to track your complaint status.</p>
                </div>
                <p className="text-muted mb-4">
                  Your complaint has been encrypted and registered. Authorities will review the details and reach out if additional information is required. You will receive email and in-app notifications at each stage of the investigation.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <button className="btn btn-success" onClick={handleTrackComplaint}>
                    <i className="bi bi-search me-2"></i>Track Complaint
                  </button>
                  <button className="btn btn-outline-success" onClick={handleNewComplaint}>
                    <i className="bi bi-plus-circle me-2"></i>File Another Complaint
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const stepTitles = {
    1: 'Personal Information',
    2: 'Incident Details',
    3: 'Evidence Upload',
    4: 'Review & Submit'
  };

  const renderFieldErrorClass = (field) => fieldErrors[field] ? 'is-invalid' : '';

  return (
    <section className="section py-5">
      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="location-modal-title" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} onClick={() => setShowLocationModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-lg p-4">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <div className="bg-success-subtle text-success rounded-circle p-3 mb-2">
                  <i className="bi bi-geo-alt-fill fs-2"></i>
                </div>
              </div>
              <div className="modal-body text-center pt-0">
                <h4 className="fw-bold mb-3" id="location-modal-title">Location Permission Required</h4>
                <p className="text-muted mb-4">
                  SHIELD.AI requires access to your current location to automatically tag the incident site for rapid response and emergency dispatch.
                </p>
                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn btn-success btn-lg rounded-pill fw-semibold" 
                    onClick={requestLocationPermission}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Detecting Location...
                      </>
                    ) : (
                      'Grant Location Permission'
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill" 
                    onClick={() => setShowLocationModal(false)}
                    disabled={locationLoading}
                  >
                    Skip / Enter Manually
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="text-center mb-4">
          <span className="section-label">Official Complaint Filing</span>
          <h2 className="fw-bold mt-3">File a complaint in four secure steps</h2>
          <p className="text-muted mt-2">
            All information is encrypted end-to-end. Only authorised cyber crime investigators can access your submission.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="feature-card p-4 h-100">
              <h5 className="fw-bold">Step {step} of 4 &middot; {stepTitles[step]}</h5>
              <p className="text-muted">Secure, guided reporting for citizens and institutions.</p>

              <div className="mt-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`progress-step mb-2 d-flex align-items-center ${s <= step ? 'active' : ''}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: s < step ? '#15803d' : s === step ? '#16A34A' : '#e9ecef',
                      color: s <= step ? 'white' : '#6c757d',
                      fontSize: '14px',
                      fontWeight: s === step ? '700' : '500',
                      gap: '10px'
                    }}
                  >
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '24px',
                        height: '24px',
                        background: s < step ? 'rgba(255,255,255,.25)' : s === step ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.08)',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      {s < step ? <i className="bi bi-check-lg"></i> : s}
                    </span>
                    <span>
                      {s === 1 && 'Personal Information'}
                      {s === 2 && 'Incident Details'}
                      {s === 3 && 'Evidence Upload'}
                      {s === 4 && 'Review & Submit'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 small text-muted">
                <p className="mb-2"><i className="bi bi-shield-lock me-1"></i> TLS 1.3 encrypted</p>
                <p className="mb-2"><i className="bi bi-eye-slash me-1"></i> No third-party sharing</p>
                <p className="mb-0"><i className="bi bi-journal-check me-1"></i> Immutable audit log</p>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <form className="contact-form p-4 rounded-4 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (step === 4) handleSubmit(e); else handleNext(); }}>
              {step === 1 && (
                <div className="row g-3">
                  <div className="col-12">
                  <h5 className="fw-bold mb-2"><i className="bi bi-person-badge me-2 text-success"></i>Step 1 &mdash; Personal Information</h5>
                    <p className="text-muted small mb-3">
                      Contact details are used only for official updates regarding your complaint and are never shared publicly.
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-name">Full Name <span className="text-danger">*</span></label>
                    <input
                      id="report-name"
                      className={`form-control ${renderFieldErrorClass('name')}`}
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      name="name"
                      disabled={loading}
                      required
                      autoComplete="name"
                    />
                    {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                    <small className="text-muted">2–255 letters, spaces, hyphens, apostrophes</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-email">Email <span className="text-danger">*</span></label>
                    <input
                      id="report-email"
                      type="email"
                      className={`form-control ${renderFieldErrorClass('email')}`}
                      placeholder="citizen@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
                    {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                    <small className="text-muted">Case updates &amp; acknowledgement will be sent here</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-mobile">Mobile Number <span className="text-danger">*</span></label>
                    <input
                      id="report-mobile"
                      type="tel"
                      inputMode="numeric"
                      className={`form-control ${renderFieldErrorClass('mobile')}`}
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      name="mobile"
                      disabled={loading}
                      required
                      maxLength={10}
                      autoComplete="tel"
                    />
                    {fieldErrors.mobile && <div className="invalid-feedback">{fieldErrors.mobile}</div>}
                    <small className="text-muted">10-digit Indian mobile number (starts with 6–9)</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-address">Residential Address</label>
                    <input
                      id="report-address"
                      className={`form-control ${renderFieldErrorClass('address')}`}
                      placeholder="Street, City, State"
                      value={formData.address}
                      onChange={handleInputChange}
                      name="address"
                      disabled={loading}
                    />
                    {fieldErrors.address && <div className="invalid-feedback">{fieldErrors.address}</div>}
                    <small className="text-muted">Optional but helps locate jurisdiction</small>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-bold mb-2"><i className="bi bi-journal-text me-2 text-success"></i>Step 2 &mdash; Incident Details</h5>
                    <p className="text-muted small mb-3">
                      Accurate details help analysts triage and assign the correct investigation team.
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="report-title">Complaint Title <span className="text-danger">*</span></label>
                    <input
                      id="report-title"
                      className={`form-control ${renderFieldErrorClass('title')}`}
                      placeholder="Short summary, e.g. Fraudulent UPI transaction of ₹50,000 on DD/MM/YYYY"
                      value={formData.title}
                      onChange={handleInputChange}
                      name="title"
                      disabled={loading}
                      required
                    />
                    {fieldErrors.title && <div className="invalid-feedback">{fieldErrors.title}</div>}
                    <small className="text-muted">{formData.title.trim().length} / 10–255 characters</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-category">Crime Category <span className="text-danger">*</span></label>
                    <select
                      id="report-category"
                      className={`form-select ${renderFieldErrorClass('category_id')}`}
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
                    {fieldErrors.category_id && <div className="invalid-feedback">{fieldErrors.category_id}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-severity">Severity</label>
                    <select
                      id="report-severity"
                      className={`form-select ${renderFieldErrorClass('severity')}`}
                      value={formData.severity}
                      onChange={handleInputChange}
                      name="severity"
                      disabled={loading}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium (Recommended)</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    {fieldErrors.severity && <div className="invalid-feedback">{fieldErrors.severity}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="report-incident-date">Incident Date</label>
                    <input
                      id="report-incident-date"
                      type="date"
                      className={`form-control ${renderFieldErrorClass('incident_date')}`}
                      value={formData.incident_date}
                      onChange={handleInputChange}
                      name="incident_date"
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {fieldErrors.incident_date && <div className="invalid-feedback">{fieldErrors.incident_date}</div>}
                    <small className="text-muted">Cannot be in the future</small>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label mb-0" htmlFor="report-location">Location (City / State)</label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-success py-0 px-2"
                        onClick={requestLocationPermission}
                        disabled={locationLoading}
                      >
                        <i className="bi bi-geo-alt-fill me-1"></i> Detect GPS Location
                      </button>
                    </div>
                    <input
                      id="report-location"
                      className={`form-control ${renderFieldErrorClass('location')}`}
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={formData.location}
                      onChange={handleInputChange}
                      name="location"
                      disabled={loading}
                    />
                    {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
                    {locationStatus && <small className="text-success d-block mt-1"><i className="bi bi-check-circle me-1"></i>{locationStatus}</small>}
                    <small className="text-muted">Used for jurisdictional routing</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="report-description">Detailed Description <span className="text-danger">*</span></label>
                    <textarea
                      id="report-description"
                      className={`form-control ${renderFieldErrorClass('description')}`}
                      rows="5"
                      placeholder="Describe what happened, when, how, parties involved, any witnesses, financial loss, and other relevant context."
                      value={formData.description}
                      onChange={handleInputChange}
                      name="description"
                      disabled={loading}
                      required
                    />
                    {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
                    <small className="text-muted">{formData.description.trim().length} / 20–5000 characters &middot; minimum 5 words</small>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="row g-3">
                  <div className="col-12">
                    <h5 className="fw-bold mb-2"><i className="bi bi-cloud-arrow-up me-2 text-success"></i>Step 3 &mdash; Evidence Upload</h5>
                    <p className="text-muted small mb-3">
                      Evidence strengthens your report. Redact sensitive account numbers before uploading.
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="report-evidence">Upload Evidence (max 5 files &middot; 10 MB each)</label>
                    <input
                      id="report-evidence"
                      type="file"
                      className={`form-control ${renderFieldErrorClass('evidence')}`}
                      multiple
                      onChange={handleFileChange}
                      disabled={loading}
                      accept="image/jpeg,image/png,image/gif,.pdf,.txt"
                    />
                    {fieldErrors.evidence && <div className="invalid-feedback d-block">{fieldErrors.evidence}</div>}
                    <small className="text-muted d-block mt-1">
                      Allowed formats: JPG, PNG, GIF, PDF, TXT. No executable files.
                    </small>
                    <div className="progress mt-2" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-success" role="progressbar"
                        style={{ width: `${Math.min(100, (uploadedFiles.length / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">{uploadedFiles.length} / 5 files attached</small>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Attached Evidence:</label>
                      <div className="list-group">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <i className={`bi ${
                                file.type.startsWith('image/') ? 'bi-file-earmark-image' :
                                file.type === 'application/pdf' ? 'bi-file-earmark-pdf' :
                                'bi-file-earmark-text'
                              } fs-4 me-3 text-success`}></i>
                              <div>
                                <div className="fw-medium">{file.name}</div>
                                <small className="text-muted">
                                  {file.size < 1024
                                    ? `${file.size} B`
                                    : file.size < 1024 * 1024
                                      ? `${(file.size / 1024).toFixed(1)} KB`
                                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                                    &middot; {file.type || 'Unknown type'}
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                            >
                              <i className="bi bi-trash me-1"></i> Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="alert alert-info mb-0 py-2 small">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Tips:</strong> Screenshots of transactions, chats, emails, SMS, caller IDs, and payment receipts are all valuable. You can add evidence on the previous step if needed.
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h5 className="fw-bold mb-3"><i className="bi bi-clipboard-check me-2 text-success"></i>Step 4 &mdash; Review &amp; Submit</h5>
                  <p className="text-muted small mb-3">
                    Please double-check all details below. Once submitted, your complaint is timestamped and immutable in the audit log.
                  </p>

                  <div className="card mb-3 border-success">
                    <h6 className="card-header bg-success text-white py-2">
                      <i className="bi bi-person me-2"></i>Personal Information
                    </h6>
                    <div className="card-body py-2">
                      <div className="row small g-2">
                        <div className="col-sm-6"><strong>Name:</strong> {formData.name || '—'}</div>
                        <div className="col-sm-6"><strong>Email:</strong> {formData.email || '—'}</div>
                        <div className="col-sm-6"><strong>Mobile:</strong> {formData.mobile || '—'}</div>
                        <div className="col-sm-6"><strong>Address:</strong> {formData.address || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3 border-success">
                    <h6 className="card-header bg-success text-white py-2">
                      <i className="bi bi-journal me-2"></i>Incident Details
                    </h6>
                    <div className="card-body py-2">
                      <div className="row small g-2">
                        <div className="col-12"><strong>Title:</strong> {formData.title || '—'}</div>
                        <div className="col-sm-6"><strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}</div>
                        <div className="col-sm-6"><strong>Severity:</strong> {formData.severity || 'medium'}</div>
                        <div className="col-sm-6"><strong>Date:</strong> {formData.incident_date || 'Not provided'}</div>
                        <div className="col-sm-6"><strong>Location:</strong> {formData.location || 'Not provided'}</div>
                        <div className="col-12">
                          <strong>Description:</strong>
                          <div className="border rounded p-2 bg-light mt-1">{formData.description || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3 border-success">
                    <h6 className="card-header bg-success text-white py-2">
                      <i className="bi bi-files me-2"></i>Evidence Files
                    </h6>
                    <div className="card-body py-2">
                      {uploadedFiles.length > 0 ? (
                        <ul className="mb-0 small ps-4">
                          {uploadedFiles.map((file, index) => (
                            <li key={index}>
                              {file.name}
                              <span className="text-muted ms-1">
                                ({file.size < 1024
                                  ? `${file.size} B`
                                  : `${(file.size / 1024).toFixed(1)} KB`})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-0 small text-muted">No files uploaded &mdash; proceeding without evidence.</p>
                      )}
                    </div>
                  </div>

                  <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Important:</strong> Clicking <em>Submit Complaint</em> registers your report officially. You will receive a secure, trackable Complaint ID. Misrepresentation or false reporting is a punishable offence under applicable cyber laws.
                  </div>

                </div>
              )}

              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                <button
                  className="btn btn-outline-success"
                  type="button"
                  onClick={handlePrevious}
                  disabled={step === 1 || loading}
                >
                  <i className="bi bi-arrow-left me-1"></i> Previous
                </button>
                {step < 4 ? (
                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : (<><i className="bi bi-send me-1"></i>Submit Complaint</>)}
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
