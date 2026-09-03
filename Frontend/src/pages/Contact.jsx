import React, { useState, useCallback } from 'react';
import { api } from '../utils/api';

const VALIDATION = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    messages: {
      required: 'Name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name must be under 100 characters',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    messages: {
      required: 'Email is required',
      pattern: 'Please enter a valid email address'
    }
  },
  phone: {
    required: false,
    pattern: /^\d{10}$/,
    messages: {
      pattern: 'Phone number must be exactly 10 digits'
    }
  },
  subject: {
    required: true,
    minLength: 3,
    maxLength: 255,
    messages: {
      required: 'Subject is required',
      minLength: 'Subject must be at least 3 characters',
      maxLength: 'Subject must be under 255 characters'
    }
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 5000,
    messages: {
      required: 'Message is required',
      minLength: 'Message must be at least 10 characters',
      maxLength: 'Message must be under 5000 characters'
    }
  }
};

function validateField(name, value) {
  const rules = VALIDATION[name];
  if (!rules) return '';

  const trimmed = value.trim();

  if (rules.required && !trimmed) {
    return rules.messages.required;
  }

  if (!trimmed) return '';

  if (rules.minLength && trimmed.length < rules.minLength) {
    return rules.messages.minLength;
  }

  if (rules.maxLength && trimmed.length > rules.maxLength) {
    return rules.messages.maxLength;
  }

  if (rules.pattern && !rules.pattern.test(trimmed)) {
    return rules.messages.pattern;
  }

  return '';
}

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(VALIDATION).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    return newErrors;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'message' && value.length > 5000) return;
    if (name === 'name' && value.length > 100) return;
    if (name === 'subject' && value.length > 255) return;

    let sanitized = value;
    if (name === 'phone') {
      sanitized = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [name]: sanitized }));

    if (touched[name]) {
      const error = validateField(name, sanitized);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const allTouched = {};
    Object.keys(VALIDATION).forEach(f => { allTouched[f] = true; });
    setTouched(allTouched);

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.keys(validationErrors)[0];
      const el = document.querySelector(`[name="${firstError}"]`);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      await api.submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
      setTouched({});
    } catch (err) {
      setSubmitError(err.message || 'Failed to send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldState = (name) => {
    if (errors[name] && touched[name]) return 'invalid';
    if (touched[name] && !errors[name] && formData[name].trim()) return 'valid';
    return '';
  };

  const getFieldClass = (name) => {
    const state = getFieldState(name);
    return `form-control ${state ? `is-${state}` : ''}`.trim();
  };

  const nameLen = formData.name.length;
  const emailLen = formData.email.length;
  const phoneDigits = formData.phone.replace(/\D/g, '').length;
  const subjectLen = formData.subject.length;
  const msgLen = formData.message.length;

  return (
    <section className="section py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-5">
            <span className="section-label">Contact</span>
            <h2 className="fw-bold mt-3">Reach our support team</h2>
            <p className="text-muted">We are here to help with registrations, updates, and digital safety concerns.</p>
            <div className="contact-info mt-4">
              <p><i className="bi bi-geo-alt-fill text-success me-2"></i>National Cyber Safety Center, New Delhi</p>
              <p><i className="bi bi-telephone-fill text-success me-2"></i>+91 1800 123 456</p>
              <p><i className="bi bi-envelope-fill text-success me-2"></i>support@cyberportal.gov</p>
            </div>
            <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(22,163,74,0.05)', borderLeft: '4px solid #16A34A' }}>
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Our team typically responds within 24-48 business hours.
              </small>
            </div>
          </div>
          <div className="col-lg-7">
            {submitted ? (
              <div className="text-center p-5 shadow-sm" style={{ background: 'rgba(22,163,74,0.05)', borderRadius: 'var(--radius)' }}>
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                </div>
                <h4 className="fw-bold text-success">Message Sent Successfully!</h4>
                <p className="text-muted mt-2">Thank you for reaching out. We will get back to you shortly.</p>
                <button
                  className="btn btn-outline-success mt-3"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form p-4 shadow-sm" onSubmit={handleSubmit} noValidate>
                {submitError && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{submitError}</span>
                    <button type="button" className="btn-close ms-auto" onClick={() => setSubmitError('')}></button>
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-name">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="contact-name"
                      className={getFieldClass('name')}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      placeholder="Your full name"
                      maxLength={100}
                      aria-describedby="name-help name-error"
                      aria-invalid={getFieldState('name') === 'invalid'}
                      autoComplete="name"
                    />
                    {errors.name && touched.name ? (
                      <div id="name-error" className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1"></i>{errors.name}
                      </div>
                    ) : (
                      <small id="name-help" className="form-text text-muted">
                        {nameLen > 0 ? `${nameLen}/100` : '2-100 characters, letters only'}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-email">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className={getFieldClass('email')}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      placeholder="you@example.com"
                      aria-describedby="email-help email-error"
                      aria-invalid={getFieldState('email') === 'invalid'}
                      autoComplete="email"
                    />
                    {errors.email && touched.email ? (
                      <div id="email-error" className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1"></i>{errors.email}
                      </div>
                    ) : (
                      <small id="email-help" className="form-text text-muted">
                        {emailLen > 0 ? `${emailLen} characters` : 'We will use this to reply to you'}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-phone">
                      Phone <small className="text-muted">(optional)</small>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={getFieldClass('phone')}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      placeholder="9876543210"
                      maxLength={10}
                      aria-describedby="phone-help phone-error"
                      aria-invalid={getFieldState('phone') === 'invalid'}
                      autoComplete="tel"
                    />
                    {errors.phone && touched.phone ? (
                      <div id="phone-error" className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1"></i>{errors.phone}
                      </div>
                    ) : (
                      <small id="phone-help" className="form-text text-muted">
                        {formData.phone.trim() ? `${phoneDigits} digits entered` : 'Exactly 10 digits'}
                      </small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="contact-subject">
                      Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      id="contact-subject"
                      className={getFieldClass('subject')}
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      placeholder="How can we help?"
                      maxLength={255}
                      aria-describedby="subject-help subject-error"
                      aria-invalid={getFieldState('subject') === 'invalid'}
                    />
                    {errors.subject && touched.subject ? (
                      <div id="subject-error" className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1"></i>{errors.subject}
                      </div>
                    ) : (
                      <small id="subject-help" className="form-text text-muted">
                        {subjectLen > 0 ? `${subjectLen}/255` : 'Brief summary of your concern'}
                      </small>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="contact-message">
                      Message <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      className={getFieldClass('message')}
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      placeholder="Tell us more about your concern..."
                      maxLength={5000}
                      aria-describedby="message-help message-error"
                      aria-invalid={getFieldState('message') === 'invalid'}
                    ></textarea>
                    {errors.message && touched.message ? (
                      <div id="message-error" className="invalid-feedback d-block">
                        <i className="bi bi-exclamation-circle me-1"></i>{errors.message}
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between">
                        <small id="message-help" className="form-text text-muted">
                          Minimum 10 characters
                        </small>
                        <small className={`form-text ${msgLen > 4500 ? 'text-warning' : 'text-muted'}`}>
                          {msgLen}/5000
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <button
                      className="btn btn-success px-4"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;
