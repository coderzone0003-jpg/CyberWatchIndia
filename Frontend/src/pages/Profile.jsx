import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getUserSession, setUserSession } from '../utils/authStorage';
import { sanitizeMobileInput, validateIndianMobile } from '../utils/phoneValidation';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Personal details form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Change password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const sessionUser = getUserSession();
      const userId = sessionUser?.id;

      if (!userId) {
        throw new Error('No logged-in user found. Please login again.');
      }

      const data = await api.getCurrentUser();
      const profile = data.user || data;

      setUser(profile);
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setErrorMessage(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const sanitized = sanitizeMobileInput(value);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validateNewPassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!formData.full_name || !formData.email) {
      setErrorMessage('Name and Email are required.');
      return;
    }

    if (formData.phone) {
      const mobileCheck = validateIndianMobile(formData.phone);
      if (!mobileCheck.valid) {
        setErrorMessage(mobileCheck.error);
        return;
      }
    }

    setUpdating(true);

    try {
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      const response = await api.updateUser(userId, {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address
      });

      const updatedUser = response.user || { ...user, ...formData };
      setUser(updatedUser);
      setUserSession(updatedUser, localStorage.getItem('token') || sessionStorage.getItem('token'));
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    const pwdValidationError = validateNewPassword(newPassword);
    if (pwdValidationError) {
      setPasswordError(pwdValidationError);
      return;
    }

    setUpdatingPassword(true);

    try {
      const userId = user?.id;
      if (!userId) throw new Error('User ID not found');

      await api.updateUser(userId, {
        currentPassword,
        newPassword
      });

      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Update password error:', err);
      setPasswordError(err.message || 'Failed to update password. Check your current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading profile...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Loading your profile data...</p>
      </div>
    );
  }

  return (
    <section className="section py-5">
      <div className="container">
        <h2 className="fw-bold mb-4">My Profile</h2>

        {errorMessage && <div className="alert alert-danger mb-4">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success mb-4">{successMessage}</div>}

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="contact-form p-4 rounded-4 shadow-sm bg-white">
              <h4 className="fw-bold mb-4">Personal Details</h4>
              <form onSubmit={handleUpdateProfile}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email (Read-only)</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      name="email"
                      value={formData.email}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mobile</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      maxLength={10}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleProfileChange}
                      placeholder="Enter your address"
                    />
                  </div>
                  <div className="col-12 mt-4">
                    <button type="submit" className="btn btn-success" disabled={updating}>
                      {updating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving Changes...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="contact-form p-4 rounded-4 shadow-sm bg-white">
              <h4 className="fw-bold mb-3">Change Password</h4>
              {passwordError && <div className="alert alert-danger mb-3 py-2 small">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success mb-3 py-2 small">{passwordSuccess}</div>}

              <form onSubmit={handleUpdatePassword}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Min 8 chars, 1 uppercase, 1 num, 1 special"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success" disabled={updatingPassword}>
                  {updatingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
