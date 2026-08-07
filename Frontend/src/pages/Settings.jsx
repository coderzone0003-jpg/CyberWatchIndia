import React from 'react';

function Settings() {
  return (
    <section className="section py-4">
      <div className="container-fluid">
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <h4 className="fw-bold mb-4">System Settings</h4>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Portal Status</label>
              <select className="form-select"><option>Active</option><option>Maintenance</option></select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Auto-Assign Officer</label>
              <select className="form-select"><option>Enabled</option><option>Disabled</option></select>
            </div>
            <div className="col-12">
              <button className="btn btn-success">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;
