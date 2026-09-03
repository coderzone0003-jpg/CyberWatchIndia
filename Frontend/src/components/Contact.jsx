import React, { useState } from 'react';
import { api } from '../utils/api';

const RULES = {
  name:    { required: true, min: 2, max: 100, msg: 'Name must be 2-100 characters' },
  email:   { required: true, msg: 'Please enter a valid email' },
  phone:   { required: false, msg: 'Phone must be exactly 10 digits' },
  subject: { required: true, min: 3, max: 255, msg: 'Subject must be 3-255 characters' },
  message: { required: true, min: 10, max: 5000, msg: 'Message must be 10-5000 characters' }
};

function validate(name, value) {
  const r = RULES[name];
  if (!r) return '';
  const v = value.trim();
  if (r.required && !v) return r.msg;
  if (!v) return '';
  if (r.min && v.length < r.min) return r.msg;
  if (r.max && v.length > r.max) return r.msg;
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return r.msg;
  if (name === 'phone' && v && !/^\d{10}$/.test(v)) return r.msg;
  return '';
}

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'phone') val = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'name' && val.length > 100) return;
    if (name === 'subject' && val.length > 255) return;
    if (name === 'message' && val.length > 5000) return;
    setForm(p => ({ ...p, [name]: val }));
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate(name, val) }));
  };

  const blur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const allErrors = {};
    Object.keys(RULES).forEach(k => { allErrors[k] = validate(k, form[k]); });
    const hasErrors = Object.values(allErrors).some(Boolean);
    setErrors(allErrors);
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });
    if (hasErrors) return;

    setLoading(true);
    try {
      await api.submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim()
      });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
      setTouched({});
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cls = (n) => `form-control ${errors[n] && touched[n] ? 'is-invalid' : touched[n] && !errors[n] && form[n].trim() ? 'is-valid' : ''}`;

  return (
    <section id="contact" className="section py-5">
      <div className="container">
        <div className="row g-5 align-items-start">
          <div className="col-lg-5">
            <span className="section-label">Contact Us</span>
            <h2 className="fw-bold mt-3">Need help? Send us a message</h2>
            <p className="text-muted">
              Our support team can help you with complaint filing, evidence guidance, and status questions.
            </p>
            <div className="contact-info mt-4">
              <p><i className="bi bi-envelope-fill text-success me-2"></i>support@cyberportal.gov</p>
              <p><i className="bi bi-telephone-fill text-success me-2"></i>+91 1800 123 456</p>
              <p><i className="bi bi-geo-alt-fill text-success me-2"></i>National Cyber Safety Center, New Delhi</p>
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
                <button className="btn btn-outline-success mt-3" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form p-4 shadow-sm" onSubmit={submit} noValidate>
                {submitError && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span>{submitError}</span>
                    <button type="button" className="btn-close ms-auto" onClick={() => setSubmitError('')}></button>
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="home-name">Name <span className="text-danger">*</span></label>
                    <input id="home-name" className={cls('name')} name="name" value={form.name} onChange={set} onBlur={blur} placeholder="Your full name" maxLength={100} />
                    {errors.name && touched.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="home-email">Email <span className="text-danger">*</span></label>
                    <input id="home-email" type="email" className={cls('email')} name="email" value={form.email} onChange={set} onBlur={blur} placeholder="you@example.com" />
                    {errors.email && touched.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="home-phone">Phone <small className="text-muted">(optional)</small></label>
                    <input id="home-phone" type="tel" inputMode="numeric" pattern="[0-9]*" className={cls('phone')} name="phone" value={form.phone} onChange={set} onBlur={blur} placeholder="9876543210" maxLength={10} />
                    {errors.phone && touched.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="home-subject">Subject <span className="text-danger">*</span></label>
                    <input id="home-subject" className={cls('subject')} name="subject" value={form.subject} onChange={set} onBlur={blur} placeholder="How can we help?" maxLength={255} />
                    {errors.subject && touched.subject && <div className="invalid-feedback d-block">{errors.subject}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="home-message">Message <span className="text-danger">*</span></label>
                    <textarea id="home-message" className={cls('message')} name="message" rows="5" value={form.message} onChange={set} onBlur={blur} placeholder="Describe your concern..." maxLength={5000}></textarea>
                    {errors.message && touched.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                    <small className="text-muted">{form.message.length}/5000</small>
                  </div>
                  <div className="col-12">
                    <button className="btn btn-success px-4" type="submit" disabled={loading}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Sending...</>
                      ) : (
                        <><i className="bi bi-send me-2"></i>Send Message</>
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

export default Contact;
