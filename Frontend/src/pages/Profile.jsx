import React from 'react';

function Profile() {
  return (
    <section className="section py-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="contact-form p-4 rounded-4 shadow-sm">
              <h4 className="fw-bold mb-4">Personal Details</h4>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" defaultValue="Aarav Sharma" /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" defaultValue="aarav@example.com" /></div>
                <div className="col-md-6"><label className="form-label">Mobile</label><input className="form-control" defaultValue="9876543210" /></div>
                <div className="col-md-6"><label className="form-label">Address</label><input className="form-control" defaultValue="Delhi" /></div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="contact-form p-4 rounded-4 shadow-sm">
              <h4 className="fw-bold mb-3">Change Password</h4>
              <div className="mb-3"><label className="form-label">Current Password</label><input type="password" className="form-control" /></div>
              <div className="mb-3"><label className="form-label">New Password</label><input type="password" className="form-control" /></div>
              <button className="btn btn-success">Update Profile</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
